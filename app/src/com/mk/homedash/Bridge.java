package com.mk.homedash;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.os.Bundle;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.AdaptiveIconDrawable;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.webkit.WebView;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Methods the web pages call as TV.methodName(). Shared by the home screen and the screensaver. */
public class Bridge {

    /** "tv", "car" or "phone": the manifest's flavor meta-data (app/, car/ or phone/AndroidManifest.xml). */
    static String flavor(Context context) {
        try {
            Bundle meta = context.getPackageManager()
                    .getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA).metaData;
            String f = meta == null ? null : meta.getString("flavor");
            return f == null ? "tv" : f;
        } catch (Exception e) {
            return "tv";
        }
    }

    private final Context context;
    private final String flavor;
    private final boolean car; // car or phone: touch screens with ordinary (non-TV) apps
    private final Handler main = new Handler(Looper.getMainLooper());
    private static final Map<String, String> iconCache = new HashMap<>();

    private View view;

    public Bridge(Context context) {
        this.context = context;
        this.flavor = flavor(context);
        this.car = !"tv".equals(flavor);
    }

    @JavascriptInterface
    public String flavor() {
        return flavor;
    }

    /**
     * Screen brightness while the home screen is in front, 0-1, or below 0 for the system's own
     * setting (the car home screen's eye comfort button). Other apps keep the system brightness.
     */
    @JavascriptInterface
    public void setBrightness(final float level) {
        if (!(context instanceof Activity)) return;
        main.post(new Runnable() {
            @Override public void run() {
                Window w = ((Activity) context).getWindow();
                WindowManager.LayoutParams lp = w.getAttributes();
                lp.screenBrightness = level < 0 ? WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
                        : Math.max(0.02f, Math.min(1f, level));
                w.setAttributes(lp);
            }
        });
    }

    /** The car's last GPS position {lat, lon, at, city, country} (car build), or null. */
    @JavascriptInterface
    public String carLocation() {
        String v = context.getSharedPreferences("home", Context.MODE_PRIVATE).getString("carLocation", null);
        return v == null ? "null" : v;
    }

    /** Silent prayer banners for when another app is in front: [{at, title, text, minutes}]. */
    @JavascriptInterface
    public void schedulePrayerAlerts(String json) {
        PrayerAlert.schedule(context, json);
    }

    /** Phone: the system bars over the page, in CSS px {top, bottom, left, right} (MainActivity). */
    static volatile String insets = "{\"top\":24,\"bottom\":0,\"left\":0,\"right\":0}";

    @JavascriptInterface
    public String insets() {
        return insets;
    }

    /** Direction and speed of the car from its last GPS fix: {bearing (-1 unknown), speed m/s, at}. */
    @JavascriptInterface
    public String carMotion() {
        try {
            return new JSONObject().put("bearing", CarLocation.bearing).put("speed", CarLocation.speed)
                    .put("at", CarLocation.fixAt).toString();
        } catch (Exception e) {
            return "null";
        }
    }

    /** Opens a geo: or google.navigation: link in Google Maps only; false if Maps isn't installed. */
    @JavascriptInterface
    public boolean openMaps(String uri) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(uri)).setPackage("com.google.android.apps.maps");
        if (i.resolveActivity(context.getPackageManager()) == null) return false;
        start(i);
        return true;
    }

    /**
     * Opens two apps side by side (the first on the left/top). With the MK Split Screen helper app
     * switched on: open the first, have the helper press the system's split-screen action, then open
     * the second next to it. Without it: ask for a split-screen launch directly (works on many
     * Android 7-11 head units). Returns "split" (helper used), "tried" (direct way) or "missing".
     */
    @JavascriptInterface
    public String launchSplit(String first, String second) {
        final Intent a = launchIntentFor(first), b = launchIntentFor(second);
        if (a == null || b == null) return "missing";
        a.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        b.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT | Intent.FLAG_ACTIVITY_MULTIPLE_TASK);
        final boolean helper = splitHelperOn();
        splitLaunchAt = System.currentTimeMillis(); // Home shows beside the first app for a moment: not a leftover
        main.post(new Runnable() {
            @Override public void run() {
                try {
                    if (helper) {
                        context.startActivity(a);
                    } else {
                        android.app.ActivityOptions o = android.app.ActivityOptions.makeBasic();
                        // Hidden API: WINDOWING_MODE_SPLIT_SCREEN_PRIMARY = 3.
                        android.app.ActivityOptions.class.getMethod("setLaunchWindowingMode", int.class).invoke(o, 3);
                        context.startActivity(a, o.toBundle());
                    }
                } catch (Exception e) {
                    Log.w("HomeDash", "split launch: " + e);
                    try { context.startActivity(a); } catch (Exception ignored) { }
                }
            }
        });
        if (helper) {
            main.postDelayed(new Runnable() {
                @Override public void run() { toggleSplit(context); }
            }, 900);
        }
        main.postDelayed(new Runnable() {
            @Override public void run() {
                try { context.startActivity(b); } catch (Exception e) { Log.w("HomeDash", "split second: " + e); }
            }
        }, helper ? 1900 : 900);
        return helper ? "split" : "tried";
    }

    /** True when the MK Split Screen helper app is installed and switched on in Accessibility. */
    @JavascriptInterface
    public boolean splitHelperOn() {
        return splitHelperOn(context);
    }

    static boolean splitHelperOn(Context context) {
        String on = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        return on != null && on.contains(SplitReceiver.PACKAGE + "/");
    }

    /** Asks the helper to press the system's split-screen action (enters split, or leaves it). */
    static void toggleSplit(Context context) {
        context.sendBroadcast(new Intent(SplitReceiver.ACTION).setClassName(SplitReceiver.PACKAGE, SplitReceiver.class.getName()));
    }

    /** The installed helper's versionCode (0 if it isn't installed). 2+: split check, Now Playing. */
    static int helperVersion(Context context) {
        try {
            return context.getPackageManager().getPackageInfo(SplitReceiver.PACKAGE, 0).versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    /* Car: Now Playing. The helper reports what's playing (MediaListener); the launcher keeps the last report. */
    static volatile String mediaState = "{}";

    static String mediaJson(Intent i) {
        JSONObject o = new JSONObject();
        try {
            if (i.hasExtra("pkg")) {
                o.put("pkg", i.getStringExtra("pkg"));
                o.put("title", i.getStringExtra("title"));
                o.put("artist", i.getStringExtra("artist"));
                o.put("album", i.getStringExtra("album"));
                o.put("duration", i.getLongExtra("duration", 0));
                o.put("art", i.getStringExtra("art"));
                o.put("state", i.getIntExtra("state", 0));
                o.put("speed", i.getFloatExtra("speed", 1f));
                o.put("position", i.getLongExtra("position", 0));
                o.put("positionAt", i.getLongExtra("positionAt", 0));
                o.put("actions", i.getLongExtra("actions", 0));
            }
            o.put("at", System.currentTimeMillis());
        } catch (Exception ignored) { }
        return o.toString();
    }

    @JavascriptInterface
    public String mediaState() {
        return mediaState;
    }

    /** {helper: versionCode, access: Notification access on for the helper}. */
    @JavascriptInterface
    public String mediaAccess() {
        String on = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
        return "{\"helper\":" + helperVersion(context) + ",\"access\":" + (on != null && on.contains(SplitReceiver.PACKAGE + "/")) + "}";
    }

    @JavascriptInterface
    public void openMediaAccess() {
        startFirst(new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"), new Intent(Settings.ACTION_SETTINGS));
    }

    /**
     * Play, pause, toggle, next, previous, seek (ms), open, or state (ask for a report). Through the
     * helper when it may see the player; else the media keys, which Android hands to the app playing.
     */
    @JavascriptInterface
    public void mediaCommand(String cmd, double value) {
        if (helperVersion(context) >= 2) {
            context.sendBroadcast(new Intent(SplitReceiver.MEDIA).setClassName(SplitReceiver.PACKAGE, SplitReceiver.class.getName())
                    .putExtra("cmd", cmd).putExtra("value", (long) value));
            String on = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
            if (on != null && on.contains(SplitReceiver.PACKAGE + "/")) return;
        }
        int key;
        switch (cmd) {
            case "toggle": key = KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE; break;
            case "play": key = KeyEvent.KEYCODE_MEDIA_PLAY; break;
            case "pause": key = KeyEvent.KEYCODE_MEDIA_PAUSE; break;
            case "next": key = KeyEvent.KEYCODE_MEDIA_NEXT; break;
            case "previous": key = KeyEvent.KEYCODE_MEDIA_PREVIOUS; break;
            default: return;
        }
        android.media.AudioManager am = (android.media.AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, key));
        am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, key));
    }

    /* Car: the Control Center's notifications (from the helper) and quick controls. */
    static volatile String notifs = "[]";

    @JavascriptInterface
    public String notifications() {
        return notifs;
    }

    /** notifs (ask for the list), nopen / ndismiss (key), nclear: passed to the helper. */
    @JavascriptInterface
    public void notifCommand(String cmd, String key) {
        context.sendBroadcast(new Intent(SplitReceiver.MEDIA).setClassName(SplitReceiver.PACKAGE, SplitReceiver.class.getName())
                .putExtra("cmd", cmd).putExtra("key", key));
    }

    /** Android's own notification shade (the Control Center's "Android panel"), through the helper. */
    @JavascriptInterface
    public void systemShade() {
        context.sendBroadcast(new Intent(SplitReceiver.MEDIA).setClassName(SplitReceiver.PACKAGE, SplitReceiver.class.getName())
                .putExtra("cmd", "systemshade"));
    }

    /** {wifi, bt (-1: none), volume, maxVolume, brightness 0-1, canWrite}. */
    @JavascriptInterface
    public String quickState() {
        JSONObject o = new JSONObject();
        try {
            WifiManager wm = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            o.put("wifi", wm != null && wm.isWifiEnabled());
            android.bluetooth.BluetoothAdapter bt = android.bluetooth.BluetoothAdapter.getDefaultAdapter();
            o.put("bt", bt == null ? -1 : bt.isEnabled() ? 1 : 0);
            android.media.AudioManager am = (android.media.AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            o.put("volume", am.getStreamVolume(android.media.AudioManager.STREAM_MUSIC));
            o.put("maxVolume", am.getStreamMaxVolume(android.media.AudioManager.STREAM_MUSIC));
            int b = Settings.System.getInt(context.getContentResolver(), Settings.System.SCREEN_BRIGHTNESS, 128);
            o.put("brightness", b / 255.0);
            o.put("canWrite", Settings.System.canWrite(context));
        } catch (Exception ignored) { }
        return o.toString();
    }

    /** Wi-Fi on/off (Android 9 and older); newer Android only allows the Wi-Fi settings panel. */
    @JavascriptInterface
    public boolean setWifi(boolean on) {
        try {
            if (android.os.Build.VERSION.SDK_INT < 29) {
                WifiManager wm = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                if (wm != null && wm.setWifiEnabled(on)) return true;
            }
        } catch (Exception ignored) { }
        openWifiSettings();
        return false;
    }

    /** Bluetooth on/off (Android 11 and older); else its settings. */
    @JavascriptInterface
    public boolean setBluetooth(boolean on) {
        try {
            android.bluetooth.BluetoothAdapter bt = android.bluetooth.BluetoothAdapter.getDefaultAdapter();
            if (bt != null && android.os.Build.VERSION.SDK_INT < 31 && (on ? bt.enable() : bt.disable())) return true;
        } catch (Exception ignored) { }
        startFirst(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS), new Intent(Settings.ACTION_SETTINGS));
        return false;
    }

    @JavascriptInterface
    public void setVolume(int v) {
        try {
            android.media.AudioManager am = (android.media.AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            am.setStreamVolume(android.media.AudioManager.STREAM_MUSIC, Math.max(0, v), 0);
        } catch (Exception ignored) { }
    }

    /**
     * The screen's brightness (0-1) for every app, when the launcher may change system settings;
     * otherwise false (the page then dims only itself, and can ask for the permission).
     */
    @JavascriptInterface
    public boolean setSystemBrightness(float level) {
        try {
            if (!Settings.System.canWrite(context)) return false;
            Settings.System.putInt(context.getContentResolver(), Settings.System.SCREEN_BRIGHTNESS_MODE, Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL);
            Settings.System.putInt(context.getContentResolver(), Settings.System.SCREEN_BRIGHTNESS, Math.round(Math.max(0.02f, Math.min(1f, level)) * 255));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @JavascriptInterface
    public void openWriteSettings() {
        startFirst(new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS, Uri.parse("package:" + context.getPackageName())), new Intent(Settings.ACTION_SETTINGS));
    }

    /* Car: File Transfer (FileServer). */

    private boolean storageOk() {
        if (android.os.Build.VERSION.SDK_INT < 23) return true;
        return context.checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
                || android.os.Build.VERSION.SDK_INT >= 30;
    }

    /** {on, port, key, ips: [...], storage: allowed, hotspot: {ssid, pass} or null}. */
    @JavascriptInterface
    public String transferState() {
        JSONObject o = new JSONObject();
        try {
            FileServer f = FileServer.current();
            o.put("on", f != null);
            if (f != null) { o.put("port", f.port()); o.put("key", f.key()); }
            o.put("ips", new JSONArray(FileServer.addresses()));
            o.put("storage", storageOk());
            if (hotspotSsid != null) o.put("hotspot", new JSONObject().put("ssid", hotspotSsid).put("pass", hotspotPass));
        } catch (Exception ignored) { }
        return o.toString();
    }

    @JavascriptInterface
    public String transferStart() {
        if (!storageOk() && context instanceof Activity) {
            final Activity a = (Activity) context;
            main.post(new Runnable() {
                @Override public void run() {
                    a.requestPermissions(new String[] {android.Manifest.permission.READ_EXTERNAL_STORAGE,
                            android.Manifest.permission.WRITE_EXTERNAL_STORAGE}, 9);
                }
            });
        }
        try {
            FileServer.start(context, new FileServer.Listener() {
                @Override public void onEvent(final String json) {
                    main.post(new Runnable() {
                        @Override public void run() {
                            if (view != null) ((WebView) view).evaluateJavascript("window.onTransfer && window.onTransfer(" + json + ")", null);
                        }
                    });
                }
            });
        } catch (Exception e) {
            Log.w("HomeDash", "file server: " + e);
        }
        return transferState();
    }

    @JavascriptInterface
    public void transferStop() {
        FileServer.stop();
        hotspot(false);
    }

    // The car's own Wi-Fi for File Transfer (Android's local-only hotspot: no internet through it).
    private static Object hotspotReservation;
    private static String hotspotSsid, hotspotPass;

    @JavascriptInterface
    public void hotspot(final boolean on) {
        main.post(new Runnable() {
            @Override public void run() {
                if (!on) {
                    try { if (hotspotReservation != null) ((android.net.wifi.WifiManager.LocalOnlyHotspotReservation) hotspotReservation).close(); } catch (Exception ignored) { }
                    hotspotReservation = null; hotspotSsid = null; hotspotPass = null;
                    return;
                }
                try {
                    WifiManager wm = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                    wm.startLocalOnlyHotspot(new WifiManager.LocalOnlyHotspotCallback() {
                        @Override public void onStarted(WifiManager.LocalOnlyHotspotReservation r) {
                            hotspotReservation = r;
                            try {
                                if (android.os.Build.VERSION.SDK_INT >= 30) {
                                    android.net.wifi.SoftApConfiguration c = r.getSoftApConfiguration();
                                    hotspotSsid = c.getSsid(); hotspotPass = c.getPassphrase();
                                } else {
                                    android.net.wifi.WifiConfiguration c = r.getWifiConfiguration();
                                    hotspotSsid = c.SSID; hotspotPass = c.preSharedKey;
                                }
                            } catch (Exception ignored) { }
                            hotspotJs(null);
                        }
                        @Override public void onFailed(int reason) { hotspotJs("failed " + reason); }
                        @Override public void onStopped() { hotspotReservation = null; hotspotSsid = null; hotspotPass = null; hotspotJs(null); }
                    }, main);
                } catch (Exception e) {
                    hotspotJs(String.valueOf(e.getMessage()));
                }
            }
        });
    }

    private void hotspotJs(String error) {
        if (view == null) return;
        ((WebView) view).evaluateJavascript("window.onHotspot && window.onHotspot(" + (error == null ? "null" : JSONObject.quote(error)) + ")", null);
    }

    /** When the last split-screen pair was opened (ms). */
    static volatile long splitLaunchAt = 0;

    @JavascriptInterface
    public boolean splitHelperInstalled() {
        try {
            context.getPackageManager().getPackageInfo(SplitReceiver.PACKAGE, 0);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @JavascriptInterface
    public void openAccessibilitySettings() {
        start(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
    }

    private Intent launchIntentFor(String pkg) {
        PackageManager pm = context.getPackageManager();
        Intent i = car ? null : pm.getLeanbackLaunchIntentForPackage(pkg);
        return i != null ? i : pm.getLaunchIntentForPackage(pkg);
    }

    /** The travel dua as a silent banner over the navigation app that was just opened. */
    @JavascriptInterface
    public void notifyTravelDua(String title, String text) {
        PrayerAlert.show(context, title, text, 10, 8);
    }

    /** Bumped whenever an app is installed, removed or updated (MainActivity listens). */
    static volatile int appsStamp = 0;

    /** Lets the page skip re-reading every app icon when nothing was installed or removed. */
    @JavascriptInterface
    public int appsStamp() {
        return appsStamp;
    }

    /** The WebView this bridge serves; prompt answers are sent back to it. */
    void attach(View view) {
        this.view = view;
    }

    /**
     * Native text prompt with the TV keyboard (a WebView text field can't get the keyboard
     * when it was focused by script). Calls window.onPrompt(text) in the page, or null if cancelled.
     */
    @JavascriptInterface
    public void promptText(final String title, final String value) {
        main.post(new Runnable() {
            @Override public void run() {
                final EditText input = new EditText(context);
                input.setText(value);
                input.setSingleLine(true);
                input.setSelectAllOnFocus(true);
                input.setImeOptions(EditorInfo.IME_ACTION_DONE);
                FrameLayout box = new FrameLayout(context);
                int pad = Math.round(24 * context.getResources().getDisplayMetrics().density);
                box.setPadding(pad, pad / 2, pad, 0);
                box.addView(input);

                final AlertDialog dialog = new AlertDialog.Builder(context, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                        .setTitle(title)
                        .setView(box)
                        .setPositiveButton("Save", new DialogInterface.OnClickListener() {
                            @Override public void onClick(DialogInterface d, int which) { answer(input.getText().toString()); }
                        })
                        .setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                            @Override public void onClick(DialogInterface d, int which) { answer(null); }
                        })
                        .setOnCancelListener(new DialogInterface.OnCancelListener() {
                            @Override public void onCancel(DialogInterface d) { answer(null); }
                        })
                        .create();
                input.setOnEditorActionListener(new TextView.OnEditorActionListener() {
                    @Override public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                        dialog.dismiss();
                        answer(input.getText().toString());
                        return true;
                    }
                });
                dialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE);
                dialog.show();
                input.requestFocus();
                input.selectAll(); // typing replaces the old name
            }
        });
    }

    private void answer(String text) {
        if (!(view instanceof WebView)) return;
        String arg = text == null ? "null" : JSONObject.quote(text);
        ((WebView) view).evaluateJavascript("window.onPrompt && window.onPrompt(" + arg + ")", null);
    }

    private void start(final Intent i) {
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        main.post(new Runnable() {
            @Override public void run() {
                try {
                    context.startActivity(i);
                } catch (Exception ignored) {
                }
            }
        });
    }

    private String iconFor(ActivityInfo info) {
        String key = info.packageName + "/" + info.name;
        String cached = iconCache.get(key);
        if (cached != null) return cached;
        PackageManager pm = context.getPackageManager();
        // TV: the wide banner when there is one. Car: always the square icon (CarPlay style).
        Drawable d = car ? null : info.loadBanner(pm);
        boolean banner = d != null;
        if (d == null) d = info.loadIcon(pm);
        String uri = "";
        boolean adaptive = car && d instanceof AdaptiveIconDrawable;
        boolean squared = false;
        if (adaptive) {
            Bitmap full = fullBleed((AdaptiveIconDrawable) d);
            uri = png("phone".equals(flavor) ? unplate(full) : full);
        } else if (d != null && "phone".equals(flavor)) {
            uri = png(unplate(squared(d)));
            squared = true;
        } else if (d != null) {
            int w = banner ? 480 : 192;
            int h = banner ? 270 : 192;
            if (d instanceof BitmapDrawable && ((BitmapDrawable) d).getBitmap() != null) {
                Bitmap src = ((BitmapDrawable) d).getBitmap();
                w = Math.min(src.getWidth(), w);
                h = Math.round(w * (src.getHeight() / (float) src.getWidth()));
            }
            Bitmap bmp = Bitmap.createBitmap(Math.max(w, 1), Math.max(h, 1), Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(bmp);
            d.setBounds(0, 0, c.getWidth(), c.getHeight());
            d.draw(c);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
            uri = "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        }
        // B = banner, F = full-bleed square icon, I = any other icon (shown smaller on a tile).
        String result = (banner ? "B" : adaptive || squared ? "F" : "I") + uri;
        iconCache.put(key, result);
        return result;
    }

    /**
     * An adaptive icon's layers without the system mask (circle, teardrop...), so every icon
     * gets the same rounded square in the page. The visible part is the middle 72 of 108 dp.
     */
    private static Bitmap fullBleed(AdaptiveIconDrawable d) {
        int size = 192, pad = size / 4;
        Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        for (Drawable layer : new Drawable[] {d.getBackground(), d.getForeground()}) {
            if (layer == null) continue;
            layer.setBounds(-pad, -pad, size + pad, size + pad);
            layer.draw(c);
        }
        return bmp;
    }

    private static String png(Bitmap b) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }

    /**
     * Phone: some phones (ColorOS, MIUI, One UI themes...) hand out icons already set on a plain
     * plate, usually white, with the real icon a smaller rounded square in the middle. Find that
     * inner square and zoom in on it, so it fills the icon like on an iPhone. Icons that really are
     * a logo on white (Chrome, Drive) have no single-colour inner square and are left alone.
     */
    static Bitmap unplate(Bitmap b) {
        int n = b.getWidth(), mid = n / 2;
        int plate = b.getPixel(n / 10, n / 2);
        // The plate: one even, opaque colour all round, just inside the edge.
        int[][] ring = {{n / 10, n / 2}, {n - 1 - n / 10, n / 2}, {n / 2, n / 10}, {n / 2, n - 1 - n / 10},
                {n / 6, n / 6}, {n - 1 - n / 6, n / 6}, {n / 6, n - 1 - n / 6}, {n - 1 - n / 6, n - 1 - n / 6}};
        for (int[] p : ring) {
            int px = b.getPixel(p[0], p[1]);
            if ((px >>> 24) < 240 || far(px, plate, 14)) return b;
        }
        // Edges of whatever sits on it, walking in from the middle of each side.
        int left = -1, right = -1, top = -1, bottom = -1;
        for (int x = 0; x < mid; x++) if (far(b.getPixel(x, mid), plate, 14)) { left = x; break; }
        for (int x = n - 1; x > mid; x--) if (far(b.getPixel(x, mid), plate, 14)) { right = x; break; }
        for (int y = 0; y < mid; y++) if (far(b.getPixel(mid, y), plate, 14)) { top = y; break; }
        for (int y = n - 1; y > mid; y--) if (far(b.getPixel(mid, y), plate, 14)) { bottom = y; break; }
        if (left < 0 || right < 0 || top < 0 || bottom < 0) return b;
        int w = right - left + 1, h = bottom - top + 1;
        // A centred square of at least half the icon...
        if (w < n * 0.5 || h < n * 0.5 || w > n * 0.97 || Math.abs(w - h) > n * 0.07
                || Math.abs(left - (n - 1 - right)) > n * 0.06 || Math.abs(top - (n - 1 - bottom)) > n * 0.06) return b;
        // ...whose sides, just inside its edge, are solid all the way along (a real inner icon
        // square; a logo on white, like Chrome or WhatsApp, lets the plate show through).
        int inset = Math.max(3, Math.round(w * 0.06f)), hits = 0, tot = 0;
        for (int j = 0; j < 20; j++) {
            float f = 0.2f + 0.6f * j / 19;
            int[][] pts = {{left + inset, (int) (top + h * f)}, {right - inset, (int) (top + h * f)},
                    {(int) (left + w * f), top + inset}, {(int) (left + w * f), bottom - inset}};
            for (int[] q : pts) { tot++; if (far(b.getPixel(q[0], q[1]), plate, 14)) hits++; }
        }
        if (hits < tot * 0.9) return b;
        // Zoom in a little past the square's own rounded corners.
        int cut = Math.round(w * 0.05f);
        Bitmap out = Bitmap.createBitmap(n, n, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(out);
        c.drawBitmap(b, new android.graphics.Rect(left + cut, top + cut, right + 1 - cut, bottom + 1 - cut),
                new android.graphics.Rect(0, 0, n, n), new android.graphics.Paint(android.graphics.Paint.FILTER_BITMAP_FLAG));
        return out;
    }

    private static boolean far(int a, int b, int tol) {
        return Math.abs(((a >> 16) & 255) - ((b >> 16) & 255)) > tol || Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)) > tol
                || Math.abs((a & 255) - (b & 255)) > tol;
    }

    /**
     * Phone: an old-style icon (round, or any shape) made into a full square like an iPhone icon.
     * A round icon fills the square in its own rim colour; any other shape sits on white.
     */
    private static Bitmap squared(Drawable d) {
        int size = 192;
        Bitmap src = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas sc = new Canvas(src);
        d.setBounds(0, 0, size, size);
        d.draw(sc);
        Bitmap out;
        if (opaqueAt(src, 2, 2) && opaqueAt(src, size - 3, 2) && opaqueAt(src, 2, size - 3) && opaqueAt(src, size - 3, size - 3)) {
            out = src; // already a full square
        } else {
            // Sample a ring just inside the edge: one even colour there means a round icon.
            long r = 0, g = 0, b = 0;
            int n = 0, opaque = 0;
            float[] mins = {255, 255, 255}, maxs = {0, 0, 0};
            for (int i = 0; i < 48; i++) {
                double a = i * Math.PI * 2 / 48;
                int x = (int) (size / 2 + Math.cos(a) * size * 0.45), y = (int) (size / 2 + Math.sin(a) * size * 0.45);
                int px = src.getPixel(x, y);
                n++;
                if ((px >>> 24) < 220) continue;
                opaque++;
                int[] ch = {(px >> 16) & 255, (px >> 8) & 255, px & 255};
                r += ch[0]; g += ch[1]; b += ch[2];
                for (int k = 0; k < 3; k++) { mins[k] = Math.min(mins[k], ch[k]); maxs[k] = Math.max(maxs[k], ch[k]); }
            }
            boolean even = opaque > n * 0.85 && maxs[0] - mins[0] < 40 && maxs[1] - mins[1] < 40 && maxs[2] - mins[2] < 40;
            out = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(out);
            if (even) {
                c.drawColor(0xFF000000 | ((int) (r / opaque) << 16) | ((int) (g / opaque) << 8) | (int) (b / opaque));
                int grow = size / 25; // a little larger, so the circle's soft edge disappears
                d.setBounds(-grow, -grow, size + grow, size + grow);
            } else {
                c.drawColor(0xFFFFFFFF);
                int pad = size / 9;
                d.setBounds(pad, pad, size - pad, size - pad);
            }
            d.draw(c);
        }
        return out;
    }

    private static boolean opaqueAt(Bitmap b, int x, int y) {
        return (b.getPixel(x, y) >>> 24) > 200;
    }

    /** Opens a web page or any other link (phone search: "Search the web"). */
    @JavascriptInterface
    public void openUrl(String url) {
        start(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
    }

    /** All launchable TV apps: [{pkg, label, banner, system, icon}]. */
    @JavascriptInterface
    public String apps() {
        PackageManager pm = context.getPackageManager();
        JSONArray arr = new JSONArray();
        Set<String> seen = new HashSet<>();
        String[] categories = car
                ? new String[] {Intent.CATEGORY_LAUNCHER}
                : new String[] {Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER};
        // Touch screens: every launcher icon, even several from one package (e.g. Phone and Contacts
        // are one package on many phones). The package's main one keeps the package name as its key
        // (so saved layouts still match), any other is "package/activity". TV: one per package.
        ActivityInfo dial = null;
        if (car) {
            try {
                ResolveInfo d = pm.resolveActivity(new Intent(Intent.ACTION_DIAL), PackageManager.MATCH_DEFAULT_ONLY);
                if (d != null) dial = d.activityInfo;
            } catch (Exception ignored) { }
        }
        Map<String, String> mainOf = new HashMap<>();
        for (String cat : categories) {
            Intent q = new Intent(Intent.ACTION_MAIN).addCategory(cat);
            List<ResolveInfo> list = pm.queryIntentActivities(q, 0);
            for (ResolveInfo ri : list) {
                String pkg = ri.activityInfo.packageName;
                String key = pkg;
                if (car) {
                    if (!mainOf.containsKey(pkg)) {
                        Intent li = pm.getLaunchIntentForPackage(pkg);
                        mainOf.put(pkg, li != null && li.getComponent() != null ? li.getComponent().getClassName() : ri.activityInfo.name);
                    }
                    if (!ri.activityInfo.name.equals(mainOf.get(pkg))) key = pkg + "/" + ri.activityInfo.name;
                }
                if (!seen.add(key)) continue;
                try {
                    String icon = iconFor(ri.activityInfo);
                    ApplicationInfo ai = ri.activityInfo.applicationInfo;
                    JSONObject o = new JSONObject();
                    o.put("pkg", key);
                    o.put("package", pkg);
                    o.put("label", ri.loadLabel(pm).toString());
                    if (dial != null && dial.packageName.equals(pkg) && (dial.name.equals(ri.activityInfo.name)
                            || dial.name.equals(ri.activityInfo.targetActivity) || ri.activityInfo.name.toLowerCase().contains("dial"))) {
                        o.put("dialer", true);
                    }
                    o.put("banner", icon.startsWith("B"));
                    o.put("small", icon.startsWith("I"));
                    o.put("system", (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
                    o.put("category", ai.category); // used to name new folders, like Apple TV does
                    if (car) {
                        try { o.put("installed", pm.getPackageInfo(pkg, 0).firstInstallTime); } catch (Exception e) { o.put("installed", 0); }
                    }
                    o.put("icon", icon.substring(1));
                    arr.put(o);
                } catch (Exception ignored) {
                }
            }
        }
        return arr.toString();
    }

    @JavascriptInterface
    public boolean launch(String pkg) {
        PackageManager pm = context.getPackageManager();
        int slash = pkg.indexOf('/');
        if (slash > 0) {
            // One of several launcher icons of a package: open that exact one.
            start(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
                    .setClassName(pkg.substring(0, slash), pkg.substring(slash + 1))
                    .addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED));
            return true;
        }
        Intent i = car ? null : pm.getLeanbackLaunchIntentForPackage(pkg);
        if (i == null) i = pm.getLaunchIntentForPackage(pkg);
        if (i == null) return false;
        start(i);
        return true;
    }

    /* ---------------- TV location (from its internet connection) ---------------- */

    private static volatile boolean locating = false;

    /** Last detected location: {lat, lon, city, country, at}, or null. */
    @JavascriptInterface
    public String location() {
        String v = context.getSharedPreferences("home", Context.MODE_PRIVATE).getString("location", null);
        return v == null ? "null" : v;
    }

    /** Looks the location up in the background (TVs have no GPS); location() has it when done. */
    @JavascriptInterface
    public void locate() {
        if (locating) return;
        locating = true;
        new Thread(new Runnable() {
            @Override public void run() {
                try {
                    JSONObject o = null;
                    try {
                        JSONObject r = new JSONObject(httpGet("https://ipwho.is/?fields=success,city,country_code,latitude,longitude"));
                        if (r.optBoolean("success")) {
                            o = new JSONObject().put("lat", r.getDouble("latitude")).put("lon", r.getDouble("longitude"))
                                    .put("city", r.optString("city")).put("country", r.optString("country_code"));
                        }
                    } catch (Exception e) {
                        Log.w("HomeDash", "ipwho.is failed: " + e);
                    }
                    if (o == null) {
                        JSONObject r = new JSONObject(httpGet("https://ipapi.co/json/"));
                        o = new JSONObject().put("lat", r.getDouble("latitude")).put("lon", r.getDouble("longitude"))
                                .put("city", r.optString("city")).put("country", r.optString("country_code"));
                    }
                    o.put("at", System.currentTimeMillis());
                    setPref("location", o.toString());
                    Log.i("HomeDash", "location: " + o.optString("city") + ", " + o.optString("country"));
                } catch (Exception e) {
                    Log.w("HomeDash", "location lookup failed: " + e);
                } finally {
                    locating = false;
                }
            }
        }).start();
    }

    /* ---------------- Google Photos shared albums ---------------- */

    private static final Pattern ALBUM_PHOTO =
            Pattern.compile("\\[\"(https://lh3\\.googleusercontent\\.com/pw/[A-Za-z0-9_\\-]+)\",(\\d+),(\\d+)");
    private static volatile boolean refreshing = false;

    /** Per-TV settings overrides (settings.json pushed with ./tv.sh settings), or null. */
    @JavascriptInterface
    public String settings() {
        File f = new File(context.getExternalFilesDir(null), "settings.json");
        try {
            return new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "null";
        }
    }

    /** Album share links, set from the Mac with ./tv.sh albums. */
    @JavascriptInterface
    public String albums() {
        File f = new File(context.getExternalFilesDir(null), "albums.json");
        try {
            return new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "[]";
        }
    }

    /** Photo URLs found in the albums on the last refresh: {at, photos: [...]}. */
    @JavascriptInterface
    public String albumPhotos() {
        String v = context.getSharedPreferences("home", Context.MODE_PRIVATE).getString("album.photos", null);
        return v == null ? "{\"at\":0,\"photos\":[]}" : v;
    }

    /** Re-reads every album link in the background; albumPhotos() has the result when done. */
    @JavascriptInterface
    public void refreshAlbums() {
        if (refreshing) return;
        refreshing = true;
        new Thread(new Runnable() {
            @Override public void run() {
                try {
                    String linksJson = albums();
                    JSONArray links = new JSONArray(linksJson);
                    Set<String> photos = new LinkedHashSet<>();
                    boolean anyOk = false;
                    for (int i = 0; i < links.length(); i++) {
                        try {
                            Matcher m = ALBUM_PHOTO.matcher(httpGet(links.getString(i)));
                            while (m.find()) {
                                // Skip tiny images (avatars, icons); keep real photos.
                                if (Integer.parseInt(m.group(2)) >= 640) photos.add(m.group(1));
                            }
                            anyOk = true;
                        } catch (Exception e) {
                            Log.w("HomeDash", "album " + i + " failed: " + e);
                        }
                    }
                    if (anyOk || links.length() == 0) {
                        JSONObject o = new JSONObject();
                        o.put("at", System.currentTimeMillis());
                        o.put("links", linksJson);
                        o.put("photos", new JSONArray(photos));
                        setPref("album.photos", o.toString());
                        Log.i("HomeDash", "albums: " + photos.size() + " photos from " + links.length() + " links");
                    }
                } catch (Exception e) {
                    Log.w("HomeDash", "album refresh failed: " + e);
                } finally {
                    refreshing = false;
                }
            }
        }).start();
    }

    private static String httpGet(String url) throws Exception {
        for (int hop = 0; hop < 6; hop++) {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            c.setRequestProperty("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36");
            c.setRequestProperty("Accept-Language", "en");
            int code = c.getResponseCode();
            if (code >= 300 && code < 400) {
                url = new URL(new URL(url), c.getHeaderField("Location")).toString();
                c.disconnect();
                continue;
            }
            if (code != 200) throw new Exception("HTTP " + code);
            try (InputStream in = c.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buf = new byte[16384];
                for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
                return out.toString("UTF-8");
            } finally {
                c.disconnect();
            }
        }
        throw new Exception("too many redirects");
    }

    /** Small persistent key/value store (home order, hidden apps), written to disk immediately. */
    @JavascriptInterface
    public String getPref(String key) {
        return context.getSharedPreferences("home", Context.MODE_PRIVATE).getString(key, null);
    }

    @JavascriptInterface
    public void setPref(String key, String value) {
        context.getSharedPreferences("home", Context.MODE_PRIVATE).edit().putString(key, value).commit();
    }

    /** Opens the system "Uninstall this app?" confirmation. */
    @JavascriptInterface
    public void uninstall(String pkg) {
        if (pkg.indexOf('/') > 0) pkg = pkg.substring(0, pkg.indexOf('/'));
        start(new Intent(Intent.ACTION_DELETE, Uri.parse("package:" + pkg)));
    }

    @JavascriptInterface
    public void openSettings() {
        startFirst(new Intent(Settings.ACTION_SETTINGS),
                new Intent().setClassName("com.android.tv.settings", "com.android.tv.settings.MainSettings"));
    }

    /**
     * Opens the first of these screens the device has. TVs (Google TV, Android TV) don't all have
     * the phone's settings screens, e.g. no Wi-Fi page under ACTION_WIFI_SETTINGS.
     */
    private void startFirst(final Intent... intents) {
        main.post(new Runnable() {
            @Override public void run() {
                PackageManager pm = context.getPackageManager();
                for (Intent i : intents) {
                    // CLEAR_TASK: if Settings is still open in the background, start it afresh on this
                    // page instead of bringing back whatever page it was left on.
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    if (i.resolveActivity(pm) == null) continue;
                    try {
                        context.startActivity(i);
                        return;
                    } catch (Exception ignored) { }
                }
                // None found (or hidden from us): just try them in turn.
                for (Intent i : intents) {
                    try {
                        context.startActivity(i);
                        return;
                    } catch (Exception ignored) { }
                }
            }
        });
    }

    /* Phone: other apps' widgets (AppWidgets). */
    @JavascriptInterface
    public String appWidgetProviders() {
        return AppWidgets.instance == null ? "[]" : AppWidgets.instance.providers();
    }

    @JavascriptInterface
    public String appWidgetPreview(String prov) {
        return AppWidgets.instance == null ? "" : AppWidgets.instance.preview(prov);
    }

    @JavascriptInterface
    public void bindAppWidget(String prov) {
        if (AppWidgets.instance != null) AppWidgets.instance.bind(prov);
    }

    @JavascriptInterface
    public void placeAppWidgets(String json) {
        if (AppWidgets.instance != null) AppWidgets.instance.place(json);
    }

    @JavascriptInterface
    public void appWidgetShot(int id) {
        if (AppWidgets.instance != null) AppWidgets.instance.shot(id);
    }

    @JavascriptInterface
    public void deleteAppWidget(int id) {
        if (AppWidgets.instance != null) AppWidgets.instance.delete(id);
    }

    /*
     * Phone: a copy of the home screen layout in Downloads/MK Launcher, which stays even if the
     * launcher is uninstalled, and Restore to read one back (Android's file picker).
     */
    static final int REQ_RESTORE = 88;
    private static Bridge picker;

    @JavascriptInterface
    public boolean backupLayout(String json) {
        if (android.os.Build.VERSION.SDK_INT < 29) return false;
        try {
            android.content.ContentResolver cr = context.getContentResolver();
            Uri col = android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI;
            String name = "MK Launcher layout.json", dir = "Download/MK Launcher/";
            Uri uri = null;
            try (android.database.Cursor c = cr.query(col, new String[] {android.provider.MediaStore.MediaColumns._ID},
                    android.provider.MediaStore.MediaColumns.DISPLAY_NAME + "=? AND " + android.provider.MediaStore.MediaColumns.RELATIVE_PATH + "=?",
                    new String[] {name, dir}, null)) {
                if (c != null && c.moveToFirst()) uri = android.content.ContentUris.withAppendedId(col, c.getLong(0));
            }
            if (uri == null) {
                android.content.ContentValues v = new android.content.ContentValues();
                v.put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, name);
                v.put(android.provider.MediaStore.MediaColumns.MIME_TYPE, "application/json");
                v.put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, dir);
                uri = cr.insert(col, v);
            }
            if (uri == null) return false;
            try (java.io.OutputStream out = cr.openOutputStream(uri, "wt")) {
                out.write(json.getBytes(StandardCharsets.UTF_8));
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @JavascriptInterface
    public void restoreLayout() {
        if (!(context instanceof Activity)) return;
        picker = this;
        main.post(new Runnable() {
            @Override public void run() {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                try { ((Activity) context).startActivityForResult(i, REQ_RESTORE); } catch (Exception ignored) { }
            }
        });
    }

    /** From MainActivity.onActivityResult: hands the picked file's text to window.onLayoutPicked. */
    static void restorePicked(Context c, Intent data) {
        final Bridge b = picker;
        picker = null;
        if (b == null || data == null || data.getData() == null || b.view == null) return;
        try (InputStream in = c.getContentResolver().openInputStream(data.getData())) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while (in != null && (n = in.read(buf)) > 0 && out.size() < 4_000_000) out.write(buf, 0, n);
            final String text = JSONObject.quote(out.toString("UTF-8"));
            b.main.post(new Runnable() {
                @Override public void run() {
                    ((WebView) b.view).evaluateJavascript("window.onLayoutPicked && window.onLayoutPicked(" + text + ")", null);
                }
            });
        } catch (Exception ignored) { }
    }

    static long roleAskAt;

    /** Home app settings, where the user picks the Home app themselves. */
    static void homeSettings(Context c) {
        try {
            c.startActivity(new Intent(Settings.ACTION_HOME_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (Exception e) {
            try { c.startActivity(new Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (Exception ignored) { }
        }
    }

    /** Whether this app is the phone's Home app (what the Home button opens). */
    @JavascriptInterface
    public boolean isDefaultHome() {
        ResolveInfo r = context.getPackageManager().resolveActivity(
                new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), PackageManager.MATCH_DEFAULT_ONLY);
        return r != null && r.activityInfo != null && context.getPackageName().equals(r.activityInfo.packageName);
    }

    /**
     * Ask to become the Home app: Android's own "Set as default home app?" dialog on Android 10+,
     * the Home app settings page before that (or when the dialog isn't offered).
     */
    @JavascriptInterface
    public void requestDefaultHome() {
        main.post(new Runnable() {
            @Override public void run() {
                if (android.os.Build.VERSION.SDK_INT >= 29 && context instanceof Activity) {
                    android.app.role.RoleManager rm = context.getSystemService(android.app.role.RoleManager.class);
                    if (rm != null && rm.isRoleAvailable(android.app.role.RoleManager.ROLE_HOME)
                            && !rm.isRoleHeld(android.app.role.RoleManager.ROLE_HOME)) {
                        try {
                            roleAskAt = System.currentTimeMillis();
                            ((Activity) context).startActivityForResult(
                                    rm.createRequestRoleIntent(android.app.role.RoleManager.ROLE_HOME), 77);
                            return;
                        } catch (Exception e) { /* fall through to settings */ }
                    }
                }
                homeSettings(context);
            }
        });
    }

    @JavascriptInterface
    public void openWifiSettings() {
        startFirst(new Intent(Settings.ACTION_WIFI_SETTINGS),
                new Intent().setClassName("com.android.tv.settings", "com.android.tv.settings.connectivity.NetworkActivity"),
                new Intent(Settings.ACTION_WIRELESS_SETTINGS),
                new Intent(Settings.ACTION_SETTINGS),
                new Intent().setClassName("com.android.tv.settings", "com.android.tv.settings.MainSettings"));
    }

    /** Whether Android has a network with internet (Wi-Fi, mobile data, Ethernet...). */
    @JavascriptInterface
    public boolean online() {
        try {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            Network n = cm.getActiveNetwork();
            NetworkCapabilities caps = n == null ? null : cm.getNetworkCapabilities(n);
            return caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        } catch (Exception e) {
            return true; // can't tell: don't claim it's offline
        }
    }

    /** {type: "wifi" | "ethernet" | "none", level: 0-4}. */
    @JavascriptInterface
    public String network() {
        JSONObject o = new JSONObject();
        try {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            Network n = cm.getActiveNetwork();
            NetworkCapabilities caps = n == null ? null : cm.getNetworkCapabilities(n);
            String type = "none";
            int level = 0;
            if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                type = "ethernet";
                level = 4;
            } else if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                type = "wifi";
                WifiManager wm = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                level = WifiManager.calculateSignalLevel(wm.getConnectionInfo().getRssi(), 5);
            }
            o.put("type", type);
            o.put("level", level);
            o.put("internet", caps != null && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED));
        } catch (Exception ignored) {
        }
        return o.toString();
    }

    /** Background photos pushed to the app's photo folder, as file:// URLs. */
    @JavascriptInterface
    public String photos() {
        JSONArray arr = new JSONArray();
        File dir = photoDir();
        File[] files = dir == null ? null : dir.listFiles();
        if (files != null) {
            Arrays.sort(files);
            for (File f : files) {
                String n = f.getName().toLowerCase();
                if (n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png") || n.endsWith(".webp")) {
                    arr.put("file://" + f.getAbsolutePath());
                }
            }
        }
        return arr.toString();
    }

    @JavascriptInterface
    public String photoFolder() {
        File dir = photoDir();
        return dir == null ? "" : dir.getAbsolutePath();
    }

    private File photoDir() {
        File dir = context.getExternalFilesDir("photos");
        if (dir != null && !dir.exists()) dir.mkdirs();
        return dir;
    }
}
