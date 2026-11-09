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
 * screen (window types only). It reads nothing on the screen.
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

    @Override public void onAccessibilityEvent(AccessibilityEvent event) { }
    @Override public void onInterrupt() { }
}
