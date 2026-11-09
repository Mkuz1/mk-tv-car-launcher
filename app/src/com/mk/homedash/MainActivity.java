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
    private long unsplitAt;

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
            registerReceiver(media, mf);
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
    }

    @Override
    protected void onStop() {
        if (phone && AppWidgets.instance != null) AppWidgets.instance.stop();
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

    /**
     * Home pressed while two apps were side by side: Android keeps the split and shows Home squeezed
     * next to a strip of the first app. With the MK Split Screen helper on, close the split and come
     * back full screen. Not while a split pair is being opened (Home briefly shows beside the first app).
     */
    private void leaveSplit() {
        if (!car || !Bridge.splitHelperOn(this)) return;
        long now = System.currentTimeMillis();
        if (now - Bridge.splitLaunchAt < 6000) return;
        // Helper 1.1+: it sees the split-screen divider itself (Home often doesn't know it's beside
        // a docked app), closes the split and brings Home back.
        if (Bridge.helperVersion(this) >= 2) {
            sendBroadcast(new Intent(SplitReceiver.CHECK).setClassName(SplitReceiver.PACKAGE, SplitReceiver.class.getName()));
            return;
        }
        if (!inSplit() || now - unsplitAt < 4000) return;
        unsplitAt = now;
        Bridge.toggleSplit(this);
        // Leaving split brings the first app to full screen; put Home back in front of it.
        getWindow().getDecorView().postDelayed(new Runnable() {
            @Override public void run() {
                startActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                        .setPackage(getPackageName()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            }
        }, 700);
    }

    /** In split screen, or (on firmwares that don't say so) drawn much narrower than the screen. */
    private boolean inSplit() {
        if (isInMultiWindowMode()) return true;
        android.graphics.Point screen = new android.graphics.Point();
        getWindowManager().getDefaultDisplay().getRealSize(screen);
        int w = getWindow().getDecorView().getWidth();
        return screen.x > screen.y && w > 0 && w < screen.x * 0.85;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Home pressed while already home: jump back to the top row.
        js("window.onTvHome && window.onTvHome()");
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
