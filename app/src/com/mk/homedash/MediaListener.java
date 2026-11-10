package com.mk.homedash;

import android.content.ComponentName;
import android.content.Intent;
import android.graphics.Bitmap;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.service.notification.NotificationListenerService;
import android.util.Base64;

import java.io.ByteArrayOutputStream;
import java.util.List;

/**
 * In the MK Car Helper (helper/): what's playing in any app (YouTube, Spotify, Anghami...), for
 * the car home screen's Now Playing card, and its play / pause / next / previous buttons. Android
 * only shares other apps' media sessions with a notification listener the user has allowed
 * (Settings → Notification access → MK Car Helper). With that access it also lists your
 * notifications in the car home screen's Control Center (open, dismiss, clear), and nowhere else.
 */
public class MediaListener extends NotificationListenerService {

    static final String LAUNCHER = "com.mk.carlauncher";
    static final String STATE = "com.mk.carlauncher.MEDIA_STATE";
    static final String NOTIFS = "com.mk.carlauncher.NOTIFS";

    static volatile MediaListener instance;

    private final Handler main = new Handler(Looper.getMainLooper());
    private MediaSessionManager msm;
    private MediaController current;
    private String artKey = "", art = "";

    private final MediaSessionManager.OnActiveSessionsChangedListener sessions =
            new MediaSessionManager.OnActiveSessionsChangedListener() {
                @Override public void onActiveSessionsChanged(List<MediaController> list) { pick(list); }
            };

    private final MediaController.Callback changes = new MediaController.Callback() {
        @Override public void onPlaybackStateChanged(PlaybackState state) {
            // Another app may have started playing: follow whichever plays.
            if (state != null && state.getState() != PlaybackState.STATE_PLAYING) repick();
            else send();
        }
        @Override public void onMetadataChanged(MediaMetadata metadata) { send(); }
        @Override public void onSessionDestroyed() { repick(); }
    };

    @Override
    public void onListenerConnected() {
        instance = this;
        try {
            msm = (MediaSessionManager) getSystemService(MEDIA_SESSION_SERVICE);
            ComponentName me = new ComponentName(this, MediaListener.class);
            msm.addOnActiveSessionsChangedListener(sessions, me, main);
            pick(msm.getActiveSessions(me));
        } catch (Exception e) {
            msm = null;
        }
        sendNotifs();
    }

    /* ---------- notifications, for the launcher's Control Center ---------- */

    @Override public void onNotificationPosted(android.service.notification.StatusBarNotification sbn) { notifsSoon(); }
    @Override public void onNotificationRemoved(android.service.notification.StatusBarNotification sbn) { notifsSoon(); }

    private final Runnable notifsNow = new Runnable() { @Override public void run() { sendNotifs(); } };
    private void notifsSoon() {
        main.removeCallbacks(notifsNow);
        main.postDelayed(notifsNow, 300);
    }

    /** The notifications shown (newest first): [{key, pkg, app, title, text, time, clear}]. */
    void sendNotifs() {
        org.json.JSONArray list = new org.json.JSONArray();
        try {
            android.service.notification.StatusBarNotification[] all = getActiveNotifications();
            if (all != null) {
                java.util.Arrays.sort(all, new java.util.Comparator<android.service.notification.StatusBarNotification>() {
                    @Override public int compare(android.service.notification.StatusBarNotification a, android.service.notification.StatusBarNotification b) {
                        return Long.compare(b.getPostTime(), a.getPostTime());
                    }
                });
                android.content.pm.PackageManager pm = getPackageManager();
                for (android.service.notification.StatusBarNotification n : all) {
                    if (list.length() >= 40) break;
                    android.app.Notification no = n.getNotification();
                    if ((no.flags & android.app.Notification.FLAG_GROUP_SUMMARY) != 0) continue;
                    android.os.Bundle x = no.extras;
                    CharSequence title = x.getCharSequence(android.app.Notification.EXTRA_TITLE);
                    CharSequence text = x.getCharSequence(android.app.Notification.EXTRA_BIG_TEXT);
                    if (text == null) text = x.getCharSequence(android.app.Notification.EXTRA_TEXT);
                    if ((title == null || title.length() == 0) && (text == null || text.length() == 0)) continue;
                    org.json.JSONObject o = new org.json.JSONObject();
                    o.put("key", n.getKey());
                    o.put("pkg", n.getPackageName());
                    String app = n.getPackageName();
                    try { app = pm.getApplicationLabel(pm.getApplicationInfo(app, 0)).toString(); } catch (Exception ignored) { }
                    o.put("app", app);
                    o.put("title", title == null ? "" : title.toString());
                    o.put("text", text == null ? "" : text.toString());
                    o.put("time", n.getPostTime());
                    o.put("clear", n.isClearable());
                    list.put(o);
                }
            }
        } catch (Exception ignored) { }
        try { sendBroadcast(new Intent(NOTIFS).setPackage(LAUNCHER).putExtra("list", list.toString())); } catch (Exception ignored) { }
    }

    /** From the launcher: open (key), dismiss (key) or clear all. */
    void notif(String cmd, String key) {
        try {
            if ("nclear".equals(cmd)) { cancelAllNotifications(); return; }
            if ("ndismiss".equals(cmd)) { cancelNotification(key); return; }
            if ("nopen".equals(cmd)) {
                for (android.service.notification.StatusBarNotification n : getActiveNotifications()) {
                    if (!n.getKey().equals(key)) continue;
                    android.app.PendingIntent pi = n.getNotification().contentIntent;
                    if (pi != null) pi.send();
                    else {
                        Intent i = getPackageManager().getLaunchIntentForPackage(n.getPackageName());
                        if (i != null) startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                    }
                    if ((n.getNotification().flags & android.app.Notification.FLAG_AUTO_CANCEL) != 0) cancelNotification(key);
                    return;
                }
            }
        } catch (Exception ignored) { }
    }

    @Override
    public void onListenerDisconnected() {
        instance = null;
        try { if (msm != null) msm.removeOnActiveSessionsChangedListener(sessions); } catch (Exception ignored) { }
        setCurrent(null);
    }

    private void repick() {
        try {
            if (msm != null) pick(msm.getActiveSessions(new ComponentName(this, MediaListener.class)));
        } catch (Exception ignored) { }
    }

    // Every session is watched, so the one that started playing last can be followed.
    private final java.util.Map<android.media.session.MediaSession.Token, Long> playedAt = new java.util.HashMap<>();
    private final java.util.Map<android.media.session.MediaSession.Token, MediaController.Callback> watching = new java.util.HashMap<>();

    private void watchAll(List<MediaController> list) {
        java.util.Set<android.media.session.MediaSession.Token> live = new java.util.HashSet<>();
        for (final MediaController c : list) {
            final android.media.session.MediaSession.Token t = c.getSessionToken();
            live.add(t);
            if (watching.containsKey(t)) continue;
            MediaController.Callback cb = new MediaController.Callback() {
                @Override public void onPlaybackStateChanged(PlaybackState st) {
                    if (st != null && st.getState() == PlaybackState.STATE_PLAYING) {
                        playedAt.put(t, System.currentTimeMillis());
                        repick();
                    }
                }
            };
            try { c.registerCallback(cb, main); watching.put(t, cb); } catch (Exception ignored) { }
            PlaybackState st = c.getPlaybackState();
            if (st != null && st.getState() == PlaybackState.STATE_PLAYING && !playedAt.containsKey(t)) playedAt.put(t, System.currentTimeMillis());
        }
        watching.keySet().retainAll(live);
        playedAt.keySet().retainAll(live);
    }

    /**
     * The player to show and control: one that is playing a real song first (some apps, like car
     * phone-link apps, keep a session open with nothing in it), the one that started playing last
     * if several, else the last one that played something.
     */
    private void pick(List<MediaController> list) {
        MediaController best = null;
        if (list != null) {
            watchAll(list);
            int bestScore = -1;
            long bestAt = -1;
            for (MediaController c : list) {
                if (getPackageName().equals(c.getPackageName()) || LAUNCHER.equals(c.getPackageName())) continue;
                PlaybackState st = c.getPlaybackState();
                boolean playing = st != null && (st.getState() == PlaybackState.STATE_PLAYING || st.getState() == PlaybackState.STATE_BUFFERING);
                MediaMetadata m = c.getMetadata();
                boolean song = m != null && text(m, MediaMetadata.METADATA_KEY_TITLE, MediaMetadata.METADATA_KEY_DISPLAY_TITLE).length() > 0;
                int score = (playing && song ? 6 : 0) + (playing ? 2 : 0) + (song ? 3 : 0);
                Long at = playedAt.get(c.getSessionToken());
                long when = at == null ? 0 : at;
                if (score > bestScore || (score == bestScore && when > bestAt)) { best = c; bestScore = score; bestAt = when; }
            }
        }
        setCurrent(best);
    }

    private static boolean contains(List<MediaController> list, MediaController c) {
        for (MediaController x : list) if (x.getSessionToken().equals(c.getSessionToken())) return true;
        return false;
    }

    private void setCurrent(MediaController c) {
        if (current != null && (c == null || !current.getSessionToken().equals(c.getSessionToken()))) {
            try { current.unregisterCallback(changes); } catch (Exception ignored) { }
        }
        boolean same = current != null && c != null && current.getSessionToken().equals(c.getSessionToken());
        current = c;
        if (c != null && !same) c.registerCallback(changes, main);
        send();
    }

    /** Tells the launcher what's playing (or that nothing is). */
    void send() {
        Intent i = new Intent(STATE).setPackage(LAUNCHER);
        MediaController c = current;
        if (c != null) {
            i.putExtra("pkg", c.getPackageName());
            MediaMetadata m = c.getMetadata();
            if (m != null) {
                i.putExtra("title", text(m, MediaMetadata.METADATA_KEY_TITLE, MediaMetadata.METADATA_KEY_DISPLAY_TITLE));
                i.putExtra("artist", text(m, MediaMetadata.METADATA_KEY_ARTIST, MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE));
                i.putExtra("album", text(m, MediaMetadata.METADATA_KEY_ALBUM, null));
                i.putExtra("duration", m.getLong(MediaMetadata.METADATA_KEY_DURATION));
                i.putExtra("art", artFor(c.getPackageName(), m));
            }
            PlaybackState s = c.getPlaybackState();
            if (s != null) {
                i.putExtra("state", s.getState());
                i.putExtra("speed", s.getPlaybackSpeed());
                // Position as of a wall-clock time, so the launcher can move the bar on its own.
                long at = System.currentTimeMillis() - (SystemClock.elapsedRealtime() - s.getLastPositionUpdateTime());
                i.putExtra("position", s.getPosition());
                i.putExtra("positionAt", at);
                i.putExtra("actions", s.getActions());
            }
        }
        try { sendBroadcast(i); } catch (Exception ignored) { }
    }

    private static String text(MediaMetadata m, String key, String fallback) {
        CharSequence v = m.getText(key);
        if ((v == null || v.length() == 0) && fallback != null) v = m.getText(fallback);
        return v == null ? "" : v.toString();
    }

    /** The cover, small, as a JPEG data URI; made again only when the song changes. */
    private String artFor(String pkg, MediaMetadata m) {
        String key = pkg + "|" + text(m, MediaMetadata.METADATA_KEY_TITLE, null) + "|" + text(m, MediaMetadata.METADATA_KEY_ARTIST, null);
        Bitmap b = m.getBitmap(MediaMetadata.METADATA_KEY_ART);
        if (b == null) b = m.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART);
        if (b == null) b = m.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON);
        key += b == null ? "|none" : "|" + b.getWidth() + "x" + b.getHeight();
        if (key.equals(artKey)) return art;
        artKey = key;
        art = "";
        if (b != null) {
            try {
                float k = Math.min(1f, 320f / Math.max(b.getWidth(), b.getHeight()));
                Bitmap s = Bitmap.createScaledBitmap(b, Math.max(1, Math.round(b.getWidth() * k)), Math.max(1, Math.round(b.getHeight() * k)), true);
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                s.compress(Bitmap.CompressFormat.JPEG, 82, out);
                art = "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
            } catch (Exception ignored) { }
        }
        return art;
    }

    private static void key(MediaController c, int code) {
        c.dispatchMediaButtonEvent(new android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, code));
        c.dispatchMediaButtonEvent(new android.view.KeyEvent(android.view.KeyEvent.ACTION_UP, code));
    }

    /** The launcher asks what's playing: look at the sessions again (some apps change track silently). */
    void refresh() {
        repick();
        send();
    }

    /** From the launcher: play, pause, toggle, next, previous, seek (ms), open. */
    void command(String cmd, long value) {
        MediaController c = current;
        if (c == null) return;
        MediaController.TransportControls t = c.getTransportControls();
        PlaybackState s = c.getPlaybackState();
        boolean playing = s != null && s.getState() == PlaybackState.STATE_PLAYING;
        switch (cmd) {
            case "toggle": if (playing) t.pause(); else t.play(); break;
            case "play": t.play(); break;
            case "pause": t.pause(); break;
            // YouTube and others often don't offer skip in their session but do take the media
            // keys (next video, previous / restart), so those go as keys to that app.
            case "next":
                if (s != null && (s.getActions() & PlaybackState.ACTION_SKIP_TO_NEXT) != 0) t.skipToNext();
                else key(c, android.view.KeyEvent.KEYCODE_MEDIA_NEXT);
                break;
            case "previous":
                if (s != null && (s.getActions() & PlaybackState.ACTION_SKIP_TO_PREVIOUS) != 0) t.skipToPrevious();
                else key(c, android.view.KeyEvent.KEYCODE_MEDIA_PREVIOUS);
                break;
            case "seek": t.seekTo(Math.max(0, value)); break;
            case "open":
                try {
                    Intent i = c.getSessionActivity() != null ? null : getPackageManager().getLaunchIntentForPackage(c.getPackageName());
                    if (c.getSessionActivity() != null) c.getSessionActivity().send();
                    else if (i != null) startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                } catch (Exception ignored) { }
                break;
            default: break;
        }
    }
}
