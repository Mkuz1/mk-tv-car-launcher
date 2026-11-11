package com.mk.homedash;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebView;

import java.util.Locale;

/** Home screen: a full-screen WebView showing assets/home.html (TV), car.html (car) or phone.html (phone). */
public class MainActivity extends Activity {

    private WebView web;
    private CarLocation location; // car and phone: GPS for prayer times
    private boolean car, phone;
    private long unsplitAt, homeIntentAt;
    private final java.util.ArrayList<Long> restores = new java.util.ArrayList<>();

    // App installed, removed or updated: the page re-reads the app list next time it shows.
    private final BroadcastReceiver packages = new BroadcastReceiver() {
        @Override public void onReceive(Context c, Intent i) {
            Bridge.appsStamp++;
        }
    };

    // Car: what's playing in any app, from the MK Car Helper (see MediaListener).
    private final BroadcastReceiver media = new BroadcastReceiver() {
        @Override public void onReceive(Context c, Intent i) {
            if ("com.mk.carlauncher.OPEN_CC".equals(i.getAction())) {
                js("window.openCC && window.openCC()");
                return;
            }
            if ("com.mk.carlauncher.NOTIFS".equals(i.getAction())) {
                String list = i.getStringExtra("list");
                Bridge.notifs = list == null ? "[]" : list;
                js("window.onNotifs && window.onNotifs()");
                return;
            }
            Bridge.mediaState = Bridge.mediaJson(i);
            js("window.onMedia && window.onMedia()");
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        homeIntentAt = System.currentTimeMillis(); // started by a Home press (or at boot): never restore a split now
        IntentFilter f = new IntentFilter();
        f.addAction(Intent.ACTION_PACKAGE_ADDED);
        f.addAction(Intent.ACTION_PACKAGE_REMOVED);
        f.addAction(Intent.ACTION_PACKAGE_CHANGED);
        f.addAction(Intent.ACTION_PACKAGE_REPLACED);
        f.addDataScheme("package");
        registerReceiver(packages, f);
        String flavor = Bridge.flavor(this);
        car = "car".equals(flavor);
        if (car) {
            IntentFilter mf = new IntentFilter("com.mk.carlauncher.MEDIA_STATE");
            mf.addAction("com.mk.carlauncher.NOTIFS");
            mf.addAction("com.mk.carlauncher.OPEN_CC");
            // From the MK Car Helper (another app).
            if (android.os.Build.VERSION.SDK_INT >= 33) registerReceiver(media, mf, 2 /* RECEIVER_EXPORTED */);
            else registerReceiver(media, mf);
        }
        phone = "phone".equals(flavor);
        // No FLAG_KEEP_SCREEN_ON here: the screensaver must be able to start on top of Home.
        web = Web.create(this, car ? "car.html" : phone ? "phone.html" : "home.html");
        if (phone) {
            // Other apps' widgets sit in a layer above the page (see AppWidgets).
            android.widget.FrameLayout root = new android.widget.FrameLayout(this);
            android.widget.FrameLayout layer = new android.widget.FrameLayout(this);
            root.addView(web);
            root.addView(layer);
            setContentView(root);
            AppWidgets.instance = new AppWidgets(this, web, layer);
            edgeToEdge();
            fitOrientation();
        } else {
            setContentView(web);
            hideSystemUi();
        }
        web.requestFocus();
        if (car || phone) {
            location = new CarLocation(this);
            location.start();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        if (requestCode == CarLocation.PERMISSION_REQUEST && location != null) location.permissionResult();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (AppWidgets.instance != null && AppWidgets.instance.onResult(requestCode, resultCode, data)) return;
        if (requestCode == Bridge.REQ_RESTORE) { if (resultCode == RESULT_OK) Bridge.restorePicked(this, data); return; }
        // Android answers "no" at once, without asking, after the user has declined it before:
        // then open the Home app settings so they can still pick this launcher.
        if (requestCode == 77 && resultCode != RESULT_OK && System.currentTimeMillis() - Bridge.roleAskAt < 700) {
            Bridge.homeSettings(this);
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (phone && AppWidgets.instance != null) AppWidgets.instance.start();
        if (car && web != null) { web.onResume(); web.resumeTimers(); }
    }

    @Override
    protected void onStop() {
        if (phone && AppWidgets.instance != null) AppWidgets.instance.stop();
        // Car: the page (and its live map) sleeps while other apps are on screen, leaving the head
        // unit's memory and processor to them, so Android doesn't close one of a split pair.
        if (car && web != null) { web.onPause(); web.pauseTimers(); }
        super.onStop();
    }

    @Override
    protected void onResume() {
        super.onResume();
        leaveSplit();
        // Again once laid out, for the width check.
        getWindow().getDecorView().postDelayed(new Runnable() {
            @Override public void run() { leaveSplit(); }
        }, 400);
        PrayerAlert.homeVisible = true;
        if (!phone) hideSystemUi();
        if (web != null) {
            web.requestFocus();
            js("window.onTvResume && window.onTvResume()");
        }
    }

    @Override
    protected void onPause() {
        PrayerAlert.homeVisible = false;
        js("window.onTvPause && window.onTvPause()");
        super.onPause();
    }

    @Override
    public void onMultiWindowModeChanged(boolean inMultiWindow) {
        super.onMultiWindowModeChanged(inMultiWindow);
        leaveSplit();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Home in front again, maybe squeezed beside a docked app: look once the size has settled.
        if (hasFocus && car) getWindow().getDecorView().postDelayed(new Runnable() {
            @Override public void run() { leaveSplit(); }
        }, 600);
    }

    /**
     * Home pressed while two apps were side by side: Android keeps the split and shows Home squeezed
     * next to a strip of the first app. With the MK Split Screen helper on, close the split and come
     * back full screen. Not while a split pair is being opened (Home briefly shows beside the first app).
     */
    private final Runnable recheck = new Runnable() {
        @Override public void run() { if (hasWindowFocus()) leaveSplit(); }
    };

    private void leaveSplit() {
        if (!car || !Bridge.splitHelperOn(this)) return;
        long now = System.currentTimeMillis();
        long wait = Bridge.splitLaunchAt + 5000 - now;
        if (wait > 0) {
            // A pair is still opening (Home shows beside the first app for a moment): look again
            // once it's had time, in case Home was pressed meanwhile.
            getWindow().getDecorView().removeCallbacks(recheck);
            getWindow().getDecorView().postDelayed(recheck, wait + 300);
            return;
        }
        if (inSplit()) {
            // Home is squeezed beside a docked app (this window is narrower than the screen).
            if (now - unsplitAt < 3000) return;
            unsplitAt = now;
            // No Home press brought it here: Android closed the second app of the pair (usually to
            // free memory) and Home fell into its place. Put that app back beside the first one.
            if (now - homeIntentAt > 4000 && restoreSplit(now)) return;
            closeSplit();
            return;
        }
        // Not narrower, but a docked app may still sit beside Home: helper 1.1+ looks for the
        // split-screen divider itself.
        if (Bridge.helperVersion(this) >= 2) {
            sendBroadcast(new Intent(SplitReceiver.CHECK).setClassName(SplitReceiver.PACKAGE, SplitReceiver.class.getName()));
        }
    }

    /** Opens the pair's second app again next to the docked one; at most 3 times in 10 minutes. */
    private boolean restoreSplit(long now) {
        while (!restores.isEmpty() && now - restores.get(0) > 600000) restores.remove(0);
        if (restores.size() >= 3) return false; // it keeps closing: give up and leave split screen
        Intent b = Bridge.splitSecondIntent(this);
        if (b == null) return false;
        restores.add(now);
        Bridge.splitLaunchAt = now;
        try { startActivity(b); return true; } catch (Exception e) { return false; }
    }

    /**
     * Close the split, then put Home back in front of the app that leaving it makes full screen.
     * Android 9 ignores the split-screen action while Home sits beside a docked app ("minimized"),
     * so if Home is still squeezed a moment later: bring the pair's second app back first (which
     * ends the minimized state), close the split from there, then come Home.
     */
    private void closeSplit() {
        final View d = getWindow().getDecorView();
        Bridge.toggleSplit(this);
        d.postDelayed(new Runnable() {
            @Override public void run() {
                if (inSplit()) {
                    final Intent b = Bridge.splitSecondIntent(MainActivity.this);
                    if (b != null) {
                        Bridge.splitLaunchAt = System.currentTimeMillis();
                        try { startActivity(b); } catch (Exception ignored) { }
                        d.postDelayed(new Runnable() {
                            @Override public void run() { Bridge.toggleSplit(MainActivity.this); d.postDelayed(goHome, 900); }
                        }, 1500);
                        return;
                    }
                }
                goHome.run();
            }
        }, 900);
    }

    private final Runnable goHome = new Runnable() {
        @Override public void run() {
            unsplitAt = System.currentTimeMillis();
            startActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                    .setPackage(getPackageName()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        }
    };

    /** In split screen, or (on firmwares that don't say so) drawn much narrower than the screen. */
    private boolean inSplit() {
        if (isInMultiWindowMode()) return true;
        android.graphics.Point screen = new android.graphics.Point();
        getWindowManager().getDefaultDisplay().getRealSize(screen);
        int w = getWindow().getDecorView().getWidth(), h = getWindow().getDecorView().getHeight();
        return (w > 0 && w < screen.x * 0.95) || (screen.y > screen.x && h > 0 && h < screen.y * 0.8);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Home pressed while already home: jump back to the top row.
        js("window.onTvHome && window.onTvHome()");
        homeIntentAt = System.currentTimeMillis(); // Home pressed: leave split screen, don't restore it
        leaveSplit();
    }

    @Override
    public void onBackPressed() {
        // This is the home screen; Back only closes menus inside the page.
        js("window.onTvBack && window.onTvBack()");
    }

    @Override
    protected void onDestroy() {
        unregisterReceiver(packages);
        if (car) unregisterReceiver(media);
        if (location != null) location.stop();
        if (car) FileServer.stop();
        super.onDestroy();
    }

    private void js(String code) {
        if (web != null) web.evaluateJavascript(code, null);
    }

    /**
     * Phone: upright on a phone-sized screen (or a foldable folded), any way round on a big one
     * (a foldable unfolded, a tablet), like the stock launchers. Checked again on every fold.
     */
    private void fitOrientation() {
        setRequestedOrientation(getResources().getConfiguration().smallestScreenWidthDp < 600
                ? android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
                : android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
    }

    @Override
    public void onConfigurationChanged(android.content.res.Configuration c) {
        super.onConfigurationChanged(c);
        if (phone) fitOrientation();
    }

    /**
     * Phone: keep the status and navigation bars (a phone needs them) but draw the page under them,
     * transparent, and tell the page how much room they take.
     */
    private void edgeToEdge() {
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        web.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override public WindowInsets onApplyWindowInsets(View v, WindowInsets in) {
                float d = getResources().getDisplayMetrics().density;
                Bridge.insets = String.format(Locale.US, "{\"top\":%.1f,\"bottom\":%.1f,\"left\":%.1f,\"right\":%.1f}",
                        in.getSystemWindowInsetTop() / d, in.getSystemWindowInsetBottom() / d,
                        in.getSystemWindowInsetLeft() / d, in.getSystemWindowInsetRight() / d);
                js("window.onInsets && window.onInsets()");
                return in;
            }
        });
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
}
