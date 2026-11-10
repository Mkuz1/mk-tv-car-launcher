package com.mk.homedash;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.webkit.WebView;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Updates from inside the app (TV, car, phone, and the car's MK Car Helper): reads versions.json of
 * the latest GitHub release, downloads the APK for this device, checks its SHA-256, and hands it
 * to Android's installer, which asks you to confirm. Android itself refuses an APK not signed like
 * the installed app. Left out of the Google Play bundles (Play updates those).
 */
final class Updater {
    static final String REPO = "Mkuz1/mk-tv-car-launcher";
    static final String VERSIONS = "https://github.com/" + REPO + "/releases/latest/download/versions.json";
    private static final String STATUS = "com.mk.homedash.UPDATE_STATUS";

    private final Context context;
    private final WebView web;
    private final Handler main = new Handler(Looper.getMainLooper());
    private volatile boolean busy;

    Updater(Context context, WebView web) {
        this.context = context;
        this.web = web;
    }

    /** Whether this build may update itself (the Play bundles leave the permission out). */
    boolean available() {
        try {
            String[] perms = context.getPackageManager().getPackageInfo(context.getPackageName(), PackageManager.GET_PERMISSIONS).requestedPermissions;
            if (perms != null) for (String p : perms) if ("android.permission.REQUEST_INSTALL_PACKAGES".equals(p)) return true;
        } catch (Exception ignored) { }
        return false;
    }

    static long installedCode(Context c, String pkg) {
        try {
            android.content.pm.PackageInfo pi = c.getPackageManager().getPackageInfo(pkg, 0);
            return android.os.Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode;
        } catch (Exception e) {
            return -1;
        }
    }

    static String installedName(Context c, String pkg) {
        try { return c.getPackageManager().getPackageInfo(pkg, 0).versionName; } catch (Exception e) { return ""; }
    }

    /** Looks for a newer version; the page hears window.onUpdateInfo({...}). */
    void check() {
        new Thread(new Runnable() {
            @Override public void run() {
                JSONObject out = new JSONObject();
                try {
                    String text = new String(fetch(VERSIONS), "UTF-8");
                    JSONObject v = new JSONObject(text);
                    JSONObject apps = v.getJSONObject("apps");
                    out.put("tag", v.optString("tag"));
                    out.put("self", entry(apps, context.getPackageName()));
                    if ("car".equals(Bridge.flavor(context)) && installedCode(context, SplitReceiver.PACKAGE) >= 0) {
                        out.put("helper", entry(apps, SplitReceiver.PACKAGE));
                    }
                } catch (Exception e) {
                    try { out.put("error", String.valueOf(e.getMessage())); } catch (Exception ignored) { }
                }
                js("window.onUpdateInfo && window.onUpdateInfo(" + out + ")");
            }
        }).start();
    }

    private JSONObject entry(JSONObject apps, String pkg) throws Exception {
        JSONObject o = new JSONObject();
        o.put("package", pkg);
        o.put("current", installedName(context, pkg));
        JSONObject a = apps.optJSONObject(pkg);
        if (a != null) {
            o.put("name", a.optString("name"));
            o.put("file", a.optString("file"));
            o.put("newer", a.optLong("code") > installedCode(context, pkg));
        }
        return o;
    }

    /** Downloads and installs the newest APK for pkg (this app, or the helper). */
    void install(final String pkg) {
        if (busy) return;
        if (android.os.Build.VERSION.SDK_INT >= 26 && !context.getPackageManager().canRequestPackageInstalls()) {
            // Android asks once: allow this app to install updates.
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + context.getPackageName()))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try { context.startActivity(i); } catch (Exception ignored) { }
            status("permission", null);
            return;
        }
        busy = true;
        new Thread(new Runnable() {
            @Override public void run() {
                try {
                    JSONObject v = new JSONObject(new String(fetch(VERSIONS), "UTF-8"));
                    String tag = v.getString("tag");
                    JSONObject a = v.getJSONObject("apps").getJSONObject(pkg);
                    String file = a.getString("file"), sha = a.optString("sha256").toLowerCase(Locale.US);
                    File apk = new File(context.getCacheDir(), "update.apk");
                    download("https://github.com/" + REPO + "/releases/download/" + tag + "/" + file, apk);
                    if (!sha.isEmpty() && !sha.equals(sha256(apk))) throw new Exception("the download is damaged; try again");
                    status("installing", null);
                    installApk(apk);
                } catch (Exception e) {
                    busy = false;
                    status("error", String.valueOf(e.getMessage()));
                }
            }
        }).start();
    }

    private void installApk(File apk) throws Exception {
        PackageInstaller pi = context.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams p = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        int id = pi.createSession(p);
        try (PackageInstaller.Session s = pi.openSession(id)) {
            try (InputStream in = new FileInputStream(apk); OutputStream out = s.openWrite("app.apk", 0, apk.length())) {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                s.fsync(out);
            }
            final String action = STATUS + "." + context.getPackageName();
            BroadcastReceiver r = new BroadcastReceiver() {
                @Override public void onReceive(Context c, Intent i) {
                    int st = i.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
                    if (st == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                        Intent confirm = i.getParcelableExtra(Intent.EXTRA_INTENT);
                        if (confirm != null) {
                            confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            try { c.startActivity(confirm); } catch (Exception e) { status("error", e.getMessage()); }
                        }
                        return;
                    }
                    try { c.unregisterReceiver(this); } catch (Exception ignored) { }
                    busy = false;
                    if (st == PackageInstaller.STATUS_SUCCESS) status("done", null);
                    else status("error", i.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE));
                }
            };
            if (android.os.Build.VERSION.SDK_INT >= 33) context.getApplicationContext().registerReceiver(r, new IntentFilter(action), 4 /* RECEIVER_NOT_EXPORTED */);
            else context.getApplicationContext().registerReceiver(r, new IntentFilter(action));
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (android.os.Build.VERSION.SDK_INT >= 31 ? 0x02000000 /* FLAG_MUTABLE */ : 0);
            PendingIntent sender = PendingIntent.getBroadcast(context, id, new Intent(action).setPackage(context.getPackageName()), flags);
            s.commit(sender.getIntentSender());
        }
    }

    private void download(String url, File to) throws Exception {
        HttpURLConnection c = open(url);
        long total = c.getContentLengthLong(), done = 0;
        int last = -1;
        try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(to)) {
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
                done += n;
                int pct = total > 0 ? (int) (done * 100 / total) : -1;
                if (pct != last) { last = pct; status("downloading", String.valueOf(pct)); }
            }
        } finally {
            c.disconnect();
        }
    }

    private static byte[] fetch(String url) throws Exception {
        HttpURLConnection c = open(url);
        try (InputStream in = c.getInputStream()) {
            java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0 && b.size() < 1_000_000) b.write(buf, 0, n);
            return b.toByteArray();
        } finally {
            c.disconnect();
        }
    }

    /** GitHub sends release files through a redirect to its download host. */
    private static HttpURLConnection open(String url) throws Exception {
        for (int i = 0; i < 6; i++) {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            c.setInstanceFollowRedirects(false);
            c.setRequestProperty("User-Agent", "MK-Launcher-Updater");
            int code = c.getResponseCode();
            if (code >= 300 && code < 400) {
                String next = c.getHeaderField("Location");
                c.disconnect();
                if (next == null) break;
                url = new URL(new URL(url), next).toString();
                if (!url.startsWith("https://")) throw new Exception("insecure redirect");
                continue;
            }
            if (code != 200) { c.disconnect(); throw new Exception("HTTP " + code); }
            return c;
        }
        throw new Exception("too many redirects");
    }

    private static String sha256(File f) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        try (InputStream in = new FileInputStream(f)) {
            byte[] buf = new byte[65536];
            int n;
            while ((n = in.read(buf)) > 0) md.update(buf, 0, n);
        }
        StringBuilder s = new StringBuilder();
        for (byte b : md.digest()) s.append(String.format(Locale.US, "%02x", b));
        return s.toString();
    }

    private void status(String state, String detail) {
        try {
            JSONObject o = new JSONObject().put("state", state);
            if (detail != null) o.put("detail", detail);
            js("window.onUpdateStatus && window.onUpdateStatus(" + o + ")");
        } catch (Exception ignored) { }
    }

    private void js(final String code) {
        main.post(new Runnable() { @Override public void run() { web.evaluateJavascript(code, null); } });
    }
}
