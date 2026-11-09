package com.mk.homedash;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * In the MK Car Helper: the launcher's requests. Press the system split-screen action; close a split
 * left behind when Home was pressed; and Now Playing (what's playing, and its buttons).
 */
public class SplitReceiver extends BroadcastReceiver {

    static final String PACKAGE = "com.mk.splithelper";
    static final String ACTION = "com.mk.splithelper.TOGGLE_SPLIT";
    static final String CHECK = "com.mk.splithelper.CHECK_SPLIT";
    static final String MEDIA = "com.mk.splithelper.MEDIA";

    @Override
    public void onReceive(Context context, Intent intent) {
        String a = intent.getAction();
        if (CHECK.equals(a)) {
            SplitService.leaveSplit(context);
        } else if (MEDIA.equals(a)) {
            String cmd = intent.getStringExtra("cmd");
            if ("systemshade".equals(cmd)) { SplitService.systemShade(); return; }
            MediaListener m = MediaListener.instance;
            if (m == null) return;
            if ("notifs".equals(cmd)) m.sendNotifs();
            else if (cmd != null && cmd.startsWith("n")) m.notif(cmd, intent.getStringExtra("key"));
            else if (cmd == null || "state".equals(cmd)) m.send();
            else m.command(cmd, intent.getLongExtra("value", 0));
        } else {
            SplitService.toggleSplit();
        }
    }
}
