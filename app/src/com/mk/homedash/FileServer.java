package com.mk.homedash;

import android.content.Context;
import android.content.res.AssetManager;
import android.os.Environment;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Car: File Transfer. While you switch it on, a small web server on the head unit serves a page
 * (assets/transfer.html) for a phone on the same Wi-Fi: browse the car's storage, upload files
 * into any folder, download, make folders, rename and delete. Every request needs the key from
 * the QR code (a new one each time it starts), and only the storage volumes can be reached.
 */
final class FileServer {
    static final int PORT = 8080;

    interface Listener { void onEvent(String json); }

    private static FileServer running;

    private final Context context;
    private final Listener listener;
    private final String key;
    private final ServerSocket server;
    private final ExecutorService pool = Executors.newFixedThreadPool(6);
    private volatile boolean stopped;

    private FileServer(Context context, Listener listener) throws IOException {
        this.context = context.getApplicationContext();
        this.listener = listener;
        byte[] b = new byte[6];
        new SecureRandom().nextBytes(b);
        StringBuilder k = new StringBuilder();
        for (byte x : b) k.append(String.format(Locale.US, "%02x", x));
        key = k.toString();
        ServerSocket s;
        try { s = new ServerSocket(PORT); } catch (IOException e) { s = new ServerSocket(0); }
        server = s;
        Thread t = new Thread(new Runnable() { @Override public void run() { loop(); } }, "file-server");
        t.setDaemon(true);
        t.start();
    }

    static synchronized FileServer start(Context c, Listener l) throws IOException {
        if (running == null) running = new FileServer(c, l);
        return running;
    }

    static synchronized void stop() {
        if (running == null) return;
        running.stopped = true;
        try { running.server.close(); } catch (IOException ignored) { }
        running.pool.shutdownNow();
        running = null;
    }

    static synchronized FileServer current() { return running; }

    String key() { return key; }
    int port() { return server.getLocalPort(); }

    /** The head unit's addresses on its networks (Wi-Fi, its own hotspot...). */
    static List<String> addresses() {
        List<String> out = new ArrayList<>();
        try {
            for (NetworkInterface n : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!n.isUp() || n.isLoopback()) continue;
                for (InetAddress a : Collections.list(n.getInetAddresses())) {
                    if (a instanceof Inet4Address && a.isSiteLocalAddress()) out.add(a.getHostAddress());
                }
            }
        } catch (Exception ignored) { }
        return out;
    }

    /* ---------- storage: only these folders, and what's inside them ---------- */

    private List<File> roots() {
        Set<String> seen = new LinkedHashSet<>();
        List<File> out = new ArrayList<>();
        File main = Environment.getExternalStorageDirectory();
        if (main != null && seen.add(canon(main))) out.add(main);
        // USB sticks and SD cards: /storage/XXXX-XXXX
        File[] vols = new File("/storage").listFiles();
        if (vols != null) {
            Arrays.sort(vols);
            for (File v : vols) {
                String n = v.getName();
                if (n.equals("self") || n.equals("emulated") || !v.isDirectory() || !v.canRead()) continue;
                if (seen.add(canon(v))) out.add(v);
            }
        }
        return out;
    }

    private static String canon(File f) {
        try { return f.getCanonicalPath(); } catch (IOException e) { return f.getAbsolutePath(); }
    }

    /** The file for a path from the page, or null if it's outside the storage volumes. */
    private File resolve(String path) {
        if (path == null || path.isEmpty()) return null;
        File f = new File(path);
        String c = canon(f);
        for (File r : roots()) {
            String rc = canon(r);
            if (c.equals(rc) || c.startsWith(rc + "/")) return f;
        }
        return null;
    }

    private static boolean okName(String n) {
        return n != null && !n.isEmpty() && !n.equals(".") && !n.equals("..") && n.indexOf('/') < 0 && n.indexOf('\0') < 0 && n.length() <= 255;
    }

    /* ---------- HTTP ---------- */

    private void loop() {
        while (!stopped) {
            try {
                final Socket s = server.accept();
                pool.execute(new Runnable() { @Override public void run() { serve(s); } });
            } catch (Exception e) {
                if (stopped) return;
            }
        }
    }

    private static final class Req {
        String method, path;
        Map<String, String> query = new HashMap<>(), headers = new HashMap<>();
        InputStream body;
        long length = -1;
    }

    private void serve(Socket s) {
        try {
            s.setSoTimeout(60000);
            InputStream in = new BufferedInputStream(s.getInputStream(), 65536);
            OutputStream out = s.getOutputStream();
            Req r = read(in);
            if (r == null) { s.close(); return; }
            String expect = r.headers.get("expect");
            if (expect != null && expect.toLowerCase(Locale.US).contains("100-continue") && authorised(r)) {
                out.write("HTTP/1.1 100 Continue\r\n\r\n".getBytes(StandardCharsets.UTF_8));
                out.flush();
            }
            try {
                handle(r, out);
            } catch (Exception e) {
                send(out, 500, "text/plain", ("Error: " + e.getMessage()).getBytes(StandardCharsets.UTF_8), null);
            }
            out.flush();
            s.close();
        } catch (Exception ignored) {
            try { s.close(); } catch (IOException ignored2) { }
        }
    }

    private static String line(InputStream in) throws IOException {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        int c;
        while ((c = in.read()) >= 0) {
            if (c == '\n') break;
            if (c != '\r') b.write(c);
            if (b.size() > 16384) throw new IOException("line too long");
        }
        if (c < 0 && b.size() == 0) return null;
        return b.toString("UTF-8");
    }

    private static Req read(InputStream in) throws IOException {
        String first = line(in);
        if (first == null) return null;
        String[] p = first.split(" ");
        if (p.length < 2) return null;
        Req r = new Req();
        r.method = p[0];
        String target = p[1];
        int q = target.indexOf('?');
        r.path = q >= 0 ? target.substring(0, q) : target;
        if (q >= 0) {
            for (String kv : target.substring(q + 1).split("&")) {
                int e = kv.indexOf('=');
                if (e > 0) r.query.put(dec(kv.substring(0, e)), dec(kv.substring(e + 1)));
            }
        }
        String h;
        while ((h = line(in)) != null && !h.isEmpty()) {
            int c = h.indexOf(':');
            if (c > 0) r.headers.put(h.substring(0, c).trim().toLowerCase(Locale.US), h.substring(c + 1).trim());
        }
        String len = r.headers.get("content-length");
        if (len != null) try { r.length = Long.parseLong(len); } catch (NumberFormatException ignored) { }
        r.body = in;
        return r;
    }

    private static String dec(String s) {
        try { return URLDecoder.decode(s, "UTF-8"); } catch (Exception e) { return s; }
    }

    private boolean authorised(Req r) {
        if (key.equals(r.query.get("k")) || key.equals(r.headers.get("x-key"))) return true;
        String cookie = r.headers.get("cookie");
        return cookie != null && cookie.contains("mkkey=" + key);
    }

    private void handle(Req r, OutputStream out) throws Exception {
        if (!authorised(r)) {
            send(out, 403, "text/html; charset=utf-8", ("<!doctype html><meta name=viewport content='width=device-width'>"
                    + "<body style='font:18px system-ui;background:#0B1418;color:#fff;padding:30px'>"
                    + "Scan the QR code on the car screen (File Transfer) to open this page.</body>").getBytes(StandardCharsets.UTF_8), null);
            return;
        }
        String path = r.query.get("path");
        switch (r.path) {
            case "/":
            case "/index.html": {
                byte[] page = asset("transfer.html");
                send(out, 200, "text/html; charset=utf-8", page, "Set-Cookie: mkkey=" + key + "; Path=/; SameSite=Strict");
                return;
            }
            case "/qrcode.js":
                send(out, 200, "application/javascript", asset("qrcode.js"), null);
                return;
            case "/api/roots": {
                JSONArray a = new JSONArray();
                for (File f : roots()) a.put(new JSONObject().put("path", f.getAbsolutePath()).put("name", rootName(f)));
                json(out, a.toString());
                return;
            }
            case "/api/list": {
                File d = resolve(path);
                if (d == null || !d.isDirectory()) { send(out, 404, "text/plain", "Not found".getBytes(), null); return; }
                JSONArray a = new JSONArray();
                File[] list = d.listFiles();
                if (list != null) {
                    for (File f : list) {
                        if (f.getName().startsWith(".")) continue;
                        a.put(new JSONObject().put("name", f.getName()).put("dir", f.isDirectory())
                                .put("size", f.isDirectory() ? 0 : f.length()).put("time", f.lastModified()));
                    }
                }
                json(out, new JSONObject().put("path", d.getAbsolutePath()).put("entries", a).put("free", d.getUsableSpace()).toString());
                return;
            }
            case "/api/file": {
                File f = resolve(path);
                if (f == null || !f.isFile()) { send(out, 404, "text/plain", "Not found".getBytes(), null); return; }
                String head = "HTTP/1.1 200 OK\r\nContent-Type: " + mime(f.getName()) + "\r\nContent-Length: " + f.length()
                        + "\r\nContent-Disposition: attachment; filename*=UTF-8''" + URLEncoder.encode(f.getName(), "UTF-8").replace("+", "%20")
                        + "\r\nConnection: close\r\n\r\n";
                out.write(head.getBytes(StandardCharsets.UTF_8));
                try (InputStream fi = new FileInputStream(f)) { copy(fi, out, f.length()); }
                return;
            }
            case "/api/upload": {
                File d = resolve(path);
                String name = r.query.get("name");
                if (!"POST".equals(r.method) || d == null || !d.isDirectory() || !okName(name) || r.length < 0) {
                    send(out, 400, "text/plain", "Bad upload".getBytes(), null);
                    return;
                }
                File f = unique(d, name), part = new File(d, "." + f.getName() + ".part");
                try (OutputStream fo = new FileOutputStream(part)) {
                    if (copy(r.body, fo, r.length) != r.length) throw new IOException("upload cut short");
                } catch (Exception e) {
                    part.delete();
                    throw e;
                }
                if (!part.renameTo(f)) { part.delete(); throw new IOException("can't save " + f.getName()); }
                event("received", f, r.length);
                json(out, new JSONObject().put("name", f.getName()).toString());
                return;
            }
            case "/api/mkdir": {
                File d = resolve(path);
                String name = r.query.get("name");
                if (!"POST".equals(r.method) || d == null || !okName(name) || !new File(d, name).mkdirs()) {
                    send(out, 400, "text/plain", "Can't make that folder".getBytes(), null);
                    return;
                }
                json(out, "{}");
                return;
            }
            case "/api/rename": {
                File f = resolve(path);
                String name = r.query.get("name");
                if (!"POST".equals(r.method) || f == null || !okName(name) || roots().contains(f) || new File(f.getParentFile(), name).exists()
                        || !f.renameTo(new File(f.getParentFile(), name))) {
                    send(out, 400, "text/plain", "Can't rename".getBytes(), null);
                    return;
                }
                json(out, "{}");
                return;
            }
            case "/api/mapskey": {
                // Car settings: the Google Maps key, pasted on the phone, for the Drive map.
                if (!"POST".equals(r.method) || r.length < 0 || r.length > 200) { send(out, 400, "text/plain", "Bad key".getBytes(), null); return; }
                ByteArrayOutputStream b = new ByteArrayOutputStream();
                copy(r.body, b, r.length);
                String k = b.toString("UTF-8").trim();
                if (!k.isEmpty() && !k.matches("[A-Za-z0-9_\\-]{20,80}")) { send(out, 400, "text/plain", "That doesn't look like a Google Maps key".getBytes(), null); return; }
                listener.onEvent(new JSONObject().put("what", "mapsKey").put("key", k).toString());
                json(out, "{}");
                return;
            }
            case "/api/delete": {
                File f = resolve(path);
                boolean isRoot = false;
                if (f != null) for (File rt : roots()) if (canon(rt).equals(canon(f))) isRoot = true;
                if (!"POST".equals(r.method) || f == null || isRoot || !deleteAll(f)) {
                    send(out, 400, "text/plain", "Can't delete".getBytes(), null);
                    return;
                }
                event("deleted", f, 0);
                json(out, "{}");
                return;
            }
            default:
                send(out, 404, "text/plain", "Not found".getBytes(), null);
        }
    }

    private String rootName(File f) {
        File main = Environment.getExternalStorageDirectory();
        if (main != null && canon(main).equals(canon(f))) return "Car storage";
        return "USB / SD " + f.getName();
    }

    private static File unique(File dir, String name) {
        File f = new File(dir, name);
        if (!f.exists()) return f;
        int dot = name.lastIndexOf('.');
        String base = dot > 0 ? name.substring(0, dot) : name, ext = dot > 0 ? name.substring(dot) : "";
        for (int i = 2; ; i++) {
            f = new File(dir, base + " (" + i + ")" + ext);
            if (!f.exists()) return f;
        }
    }

    private static boolean deleteAll(File f) {
        // Never follow a link out of the folder being deleted.
        if (f.isDirectory() && canon(f).equals(f.getAbsolutePath())) {
            File[] list = f.listFiles();
            if (list != null) for (File c : list) if (!deleteAll(c)) return false;
        }
        return f.delete();
    }

    private void event(String what, File f, long size) {
        try {
            listener.onEvent(new JSONObject().put("what", what).put("name", f.getName())
                    .put("folder", f.getParentFile() != null ? f.getParentFile().getName() : "").put("size", size).toString());
        } catch (Exception ignored) { }
    }

    private byte[] asset(String name) throws IOException {
        AssetManager am = context.getAssets();
        try (InputStream in = am.open(name)) {
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            copy(in, b, Long.MAX_VALUE);
            return b.toByteArray();
        }
    }

    private static long copy(InputStream in, OutputStream out, long max) throws IOException {
        byte[] buf = new byte[65536];
        long done = 0;
        while (done < max) {
            int n = in.read(buf, 0, (int) Math.min(buf.length, max - done));
            if (n < 0) break;
            out.write(buf, 0, n);
            done += n;
        }
        return done;
    }

    private static void json(OutputStream out, String body) throws IOException {
        send(out, 200, "application/json; charset=utf-8", body.getBytes(StandardCharsets.UTF_8), null);
    }

    private static void send(OutputStream out, int code, String type, byte[] body, String extra) throws IOException {
        String status = code == 200 ? "OK" : code == 403 ? "Forbidden" : code == 404 ? "Not Found" : code == 400 ? "Bad Request" : "Error";
        String head = "HTTP/1.1 " + code + " " + status + "\r\nContent-Type: " + type + "\r\nContent-Length: " + body.length
                + "\r\nCache-Control: no-store\r\nConnection: close\r\n" + (extra != null ? extra + "\r\n" : "") + "\r\n";
        out.write(head.getBytes(StandardCharsets.UTF_8));
        out.write(body);
    }

    private static String mime(String name) {
        String n = name.toLowerCase(Locale.US);
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".mp4")) return "video/mp4";
        if (n.endsWith(".mp3")) return "audio/mpeg";
        if (n.endsWith(".pdf")) return "application/pdf";
        if (n.endsWith(".apk")) return "application/vnd.android.package-archive";
        return "application/octet-stream";
    }
}
