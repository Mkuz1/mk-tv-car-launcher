package com.mk.homedash;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import org.json.JSONObject;

import java.util.List;
import java.util.Locale;

/**
 * The car's position from its GPS, for prayer times that follow the car. Saved as
 * {lat, lon, at, city, country} in the "carLocation" preference, read by the page with
 * TV.carLocation(). The city and country come from the Geocoder when the head unit has one.
 */
final class CarLocation implements LocationListener {

    static final int PERMISSION_REQUEST = 7;
    private static final long MIN_TIME_MS = 2000; // often enough for the Qibla compass while driving
    private static final long SAVE_EVERY_MS = 2 * 60 * 1000;
    private static final float SAVE_DISTANCE_M = 1000;
    private static final float RENAME_DISTANCE_M = 4000; // look the city up again after this far

    private final Activity activity;
    private LocationManager lm;
    private boolean listening;
    private long savedAt;
    private Location saved;

    /** Latest fix, for the direction of travel: {bearing, speed (m/s), at} via TV.carMotion(). */
    static volatile float bearing = -1, speed = 0;
    static volatile long fixAt = 0;
    static volatile double lat = 0, lon = 0; // live, for the Drive map following the car

    CarLocation(Activity activity) {
        this.activity = activity;
    }

    /** Asks for location (and, on Android 13+, notification) permission once, then starts listening. */
    void start() {
        if (granted()) {
            listen();
            return;
        }
        String[] perms = Build.VERSION.SDK_INT >= 33
                ? new String[] {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION, "android.permission.POST_NOTIFICATIONS"}
                : new String[] {Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION};
        activity.requestPermissions(perms, PERMISSION_REQUEST);
    }

    private boolean granted() {
        return activity.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || activity.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    /** Called from MainActivity.onRequestPermissionsResult. */
    void permissionResult() {
        if (granted()) listen();
    }

    @SuppressWarnings("MissingPermission")
    private void listen() {
        if (listening) return;
        try {
            lm = (LocationManager) activity.getSystemService(Context.LOCATION_SERVICE);
            Location best = null;
            for (String p : new String[] {LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER}) {
                if (!lm.getAllProviders().contains(p)) continue;
                Location l = lm.getLastKnownLocation(p);
                if (l != null && (best == null || l.getTime() > best.getTime())) best = l;
                if (!LocationManager.PASSIVE_PROVIDER.equals(p) && lm.isProviderEnabled(p)) {
                    lm.requestLocationUpdates(p, MIN_TIME_MS, 0, this);
                }
            }
            lm.requestLocationUpdates(LocationManager.PASSIVE_PROVIDER, MIN_TIME_MS, 0, this);
            listening = true;
            if (best != null) onLocationChanged(best);
        } catch (Exception e) {
            Log.w("HomeDash", "location updates failed: " + e);
        }
    }

    void stop() {
        if (lm != null && listening) lm.removeUpdates(this);
        listening = false;
    }

    @Override
    public void onLocationChanged(final Location l) {
        bearing = l.hasBearing() ? l.getBearing() : -1;
        speed = l.hasSpeed() ? l.getSpeed() : 0;
        fixAt = System.currentTimeMillis();
        lat = l.getLatitude();
        lon = l.getLongitude();
        // The position itself is saved (and the city looked up) every 2 minutes or 1 km at most.
        if (saved != null && System.currentTimeMillis() - savedAt < SAVE_EVERY_MS && saved.distanceTo(l) < SAVE_DISTANCE_M) return;
        saved = l;
        savedAt = System.currentTimeMillis();
        final Context ctx = activity.getApplicationContext();
        new Thread(new Runnable() {
            @Override public void run() {
                try {
                    JSONObject old = null;
                    String saved = ctx.getSharedPreferences("home", Context.MODE_PRIVATE).getString("carLocation", null);
                    if (saved != null) old = new JSONObject(saved);
                    JSONObject o = new JSONObject().put("lat", l.getLatitude()).put("lon", l.getLongitude())
                            .put("at", System.currentTimeMillis());
                    float[] d = new float[1];
                    boolean near = false;
                    if (old != null) {
                        Location.distanceBetween(old.getDouble("lat"), old.getDouble("lon"), l.getLatitude(), l.getLongitude(), d);
                        near = d[0] < RENAME_DISTANCE_M && old.optString("city").length() > 0;
                    }
                    if (near) {
                        o.put("city", old.optString("city")).put("country", old.optString("country"));
                    } else {
                        name(ctx, l, o, old);
                    }
                    ctx.getSharedPreferences("home", Context.MODE_PRIVATE).edit().putString("carLocation", o.toString()).commit();
                } catch (Exception e) {
                    Log.w("HomeDash", "saving location failed: " + e);
                }
            }
        }).start();
    }

    /** City and country for the place: the Geocoder, else the last known name. */
    private static void name(Context ctx, Location l, JSONObject o, JSONObject old) throws Exception {
        String city = "", country = "";
        if (Geocoder.isPresent()) {
            try {
                List<Address> a = new Geocoder(ctx, Locale.ENGLISH).getFromLocation(l.getLatitude(), l.getLongitude(), 1);
                if (a != null && !a.isEmpty()) {
                    Address ad = a.get(0);
                    city = ad.getLocality() != null ? ad.getLocality()
                            : ad.getSubAdminArea() != null ? ad.getSubAdminArea() : ad.getAdminArea();
                    country = ad.getCountryCode();
                }
            } catch (Exception e) {
                Log.w("HomeDash", "geocoder failed: " + e);
            }
        }
        if ((city == null || city.isEmpty()) && old != null) city = old.optString("city");
        if ((country == null || country.isEmpty()) && old != null) country = old.optString("country");
        o.put("city", city == null ? "" : city).put("country", country == null ? "" : country);
    }

    @Override public void onStatusChanged(String provider, int status, Bundle extras) { }
    @Override public void onProviderEnabled(String provider) { }
    @Override public void onProviderDisabled(String provider) { }
}
