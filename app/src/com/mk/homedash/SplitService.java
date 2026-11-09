package com.mk.homedash;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityWindowInfo;

/**
 * Lets the car home screen put two apps side by side. Apps can't enter split screen themselves,
 * so when you switch this on (Settings → Accessibility → MK Split Screen) the launcher uses it only
 * to press the system's "split screen" action, and to see whether the split-screen divider is on
 * screen (window types only). On the car home screen it also swaps Android's notification shade for
 * the launcher's Control Center: when the shade is pulled down over the home screen, it closes it and
 * asks the launcher to open its own. It reads nothing on the screen beyond which app is in front.
 */
public class SplitService extends AccessibilityService {

    static volatile SplitService instance;

    @Override
    protected void onServiceConnected() {
        instance = this;
    }

    @Override
    public boolean onUnbind(android.content.Intent intent) {
        instance = null;
        return super.onUnbind(intent);
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

    /** Docks the app in front to one side; the next app opened with LAUNCH_ADJACENT fills the other. */
    static boolean toggleSplit() {
        SplitService s = instance;
        return s != null && s.performGlobalAction(GLOBAL_ACTION_TOGGLE_SPLIT_SCREEN);
    }

    private static long leftAt = 0;

    /**
     * Home was pressed while two apps were side by side: Android keeps the first app docked as a
     * strip beside Home. If the split-screen divider is on screen, close the split and bring the
     * car home screen back in front of the app that leaving split screen makes full screen.
     */
    static void leaveSplit(final Context context) {
        final SplitService s = instance;
        if (s == null || !s.dividerShown()) return;
        long now = System.currentTimeMillis();
        if (now - leftAt < 3000) return;
        leftAt = now;
        s.performGlobalAction(GLOBAL_ACTION_TOGGLE_SPLIT_SCREEN);
        final Handler h = new Handler(Looper.getMainLooper());
        h.postDelayed(new Runnable() {
            @Override public void run() {
                home(context);
                // Some firmwares need a second go.
                h.postDelayed(new Runnable() {
                    @Override public void run() {
                        SplitService t = instance;
                        if (t != null && t.dividerShown()) { t.performGlobalAction(GLOBAL_ACTION_TOGGLE_SPLIT_SCREEN); h.postDelayed(new Runnable() {
                            @Override public void run() { home(context); }
                        }, 700); }
                    }
                }, 1200);
            }
        }, 700);
    }

    private static void home(Context context) {
        try {
            context.startActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                    .setPackage(MediaListener.LAUNCHER).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        } catch (Exception ignored) { }
    }

    /** Whether the split-screen divider is on screen (it only exists while two apps are docked). */
    boolean dividerShown() {
        try {
            for (AccessibilityWindowInfo w : getWindows()) {
                if (w.getType() == AccessibilityWindowInfo.TYPE_SPLIT_SCREEN_DIVIDER) return true;
            }
        } catch (Exception ignored) { }
        return false;
    }

    /* ---------- the notification shade over the car home screen ---------- */

    private static final String SYSTEMUI = "com.android.systemui";
    private String front = "";          // the app in front (last window change from an app)
    private long swappedAt = 0;
    private static long systemUntil = 0; // "Android panel" from the Control Center: leave the shade alone

    @Override public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        CharSequence p = event.getPackageName();
        String pkg = p == null ? "" : p.toString();
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && !pkg.isEmpty()
                && !SYSTEMUI.equals(pkg) && !pkg.contains("inputmethod") && !pkg.equals(getPackageName())) {
            front = pkg;
        }
        if (SYSTEMUI.equals(pkg) || event.getEventType() == AccessibilityEvent.TYPE_WINDOWS_CHANGED) swapShade();
    }

    private void swapShade() {
        long now = System.currentTimeMillis();
        if (!MediaListener.LAUNCHER.equals(front) || now < systemUntil || now - swappedAt < 1500 || !shadeOpen()) return;
        swappedAt = now;
        performGlobalAction(GLOBAL_ACTION_BACK); // closes the shade
        try { sendBroadcast(new Intent("com.mk.carlauncher.OPEN_CC").setPackage(MediaListener.LAUNCHER)); } catch (Exception ignored) { }
    }

    /** Android's shade is down: a System UI window covering most of the screen (not the lock screen). */
    private boolean shadeOpen() {
        try {
            android.app.KeyguardManager km = (android.app.KeyguardManager) getSystemService(KEYGUARD_SERVICE);
            if (km != null && km.isKeyguardLocked()) return false;
            int h = getResources().getDisplayMetrics().heightPixels;
            android.graphics.Rect r = new android.graphics.Rect();
            for (AccessibilityWindowInfo w : getWindows()) {
                if (w.getType() != AccessibilityWindowInfo.TYPE_SYSTEM) continue;
                w.getBoundsInScreen(r);
                if (r.height() < h * 0.6) continue;
                android.view.accessibility.AccessibilityNodeInfo root = w.getRoot();
                if (root != null && SYSTEMUI.contentEquals(root.getPackageName() == null ? "" : root.getPackageName())) return true;
            }
        } catch (Exception ignored) { }
        return false;
    }

    /** The launcher's "Android panel" button: the real shade, for a little while. */
    static void systemShade() {
        SplitService s = instance;
        if (s == null) return;
        systemUntil = System.currentTimeMillis() + 15000;
        s.performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS);
    }
    @Override public void onInterrupt() { }
}
