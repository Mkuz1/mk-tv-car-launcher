#!/bin/bash
# Builds the APKs from app/ using the Android SDK command-line tools (no Gradle):
#   ./build.sh          both: out/mk-tv-launcher.apk and out/mk-car-launcher.apk
#   ./build.sh tv       Google TV / Android TV only (app/AndroidManifest.xml)
#   ./build.sh phone    out/mk-phone-launcher.apk: the phone home screen (phone/AndroidManifest.xml)
#   ./build.sh helper   out/mk-split-helper.apk: the optional split-screen helper for the car (helper/)
#   ./build.sh car      car head unit only (car/AndroidManifest.xml); same code and pages,
#                       the app picks the car home screen from the manifest's "flavor".
# Needs JDK 17+ and an Android SDK with build-tools and a platform (tools/setup-sdk.sh installs both).
#
# With BUNDLETOOL=path/to/bundletool-all.jar each app is also built as an .aab for Google Play.
#
# Signing: a local keystore is created in keystore/ on first build. To sign with your own,
# set KEYSTORE_FILE, KEYSTORE_PASSWORD and KEYSTORE_ALIAS.
set -euo pipefail
cd "$(dirname "$0")"

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
for c in "$HOME/Library/Android/sdk" "$HOME/Android/Sdk"; do
  [ -n "$SDK" ] && break
  [ -d "$c" ] && SDK="$c"
done
[ -d "${SDK:-}" ] || { echo "Android SDK not found. Run tools/setup-sdk.sh or set ANDROID_HOME." >&2; exit 1; }
BT="$(ls -d "$SDK"/build-tools/* 2>/dev/null | grep -v -- "-rc" | sort -V | tail -1)"
# Compile against a stable platform (34 or 35 when installed), never a preview one: some
# head units (Android 9) refuse APKs built against preview SDKs.
JAR=""
for v in 35 34; do [ -f "$SDK/platforms/android-$v/android.jar" ] && { JAR="$SDK/platforms/android-$v/android.jar"; break; }; done
[ -n "$JAR" ] || JAR="$(ls -d "$SDK"/platforms/android-[0-9]*/android.jar 2>/dev/null | sort -V | tail -1)"
[ -x "$BT/aapt2" ] && [ -f "$JAR" ] || { echo "Missing build-tools or platform in $SDK. Run tools/setup-sdk.sh." >&2; exit 1; }

if [ -z "${JAVA_HOME:-}" ]; then
  JAVA_HOME="$(ls -d "$HOME"/Library/Java/JavaVirtualMachines/jdk-*/Contents/Home 2>/dev/null | sort -V | tail -1 || true)"
fi
[ -n "${JAVA_HOME:-}" ] && export JAVA_HOME && export PATH="$JAVA_HOME/bin:$PATH"
command -v javac >/dev/null || { echo "JDK not found. Run tools/setup-sdk.sh or set JAVA_HOME." >&2; exit 1; }

OUT=out
KS="${KEYSTORE_FILE:-keystore/homedash.jks}"
PASS="${KEYSTORE_PASSWORD:-homedash}"
ALIAS="${KEYSTORE_ALIAS:-homedash}"
if [ ! -f "$KS" ]; then
  mkdir -p "$(dirname "$KS")"
  keytool -genkeypair -keystore "$KS" -storepass "$PASS" -keypass "$PASS" -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=MK TV and Car Launcher" >/dev/null 2>&1
fi

# build <flavor> <manifest> <min-sdk> <apk name> [extra res dir [assets: keep the web pages]]
# (the car gets nothing beyond the shared res: its head units refuse unusual packages)
build() {
  local B=$OUT/build-$1 APK=$OUT/$4 EXTRA=() ASSETS=(-A app/assets)
  rm -rf "$B"; mkdir -p "$B"/{res,gen,classes,dex}

  "$BT/aapt2" compile --dir app/res -o "$B/res/res.zip"
  if [ -n "${5:-}" ]; then
    "$BT/aapt2" compile --dir "$5" -o "$B/res/extra.zip"
    EXTRA=(-R "$B/res/extra.zip" --auto-add-overlay)
    [ "${6:-}" = assets ] || ASSETS=()
  fi
  "$BT/aapt2" link -o "$B/unsigned.apk" -I "$JAR" \
    --manifest "$2" ${ASSETS[@]+"${ASSETS[@]}"} --java "$B/gen" \
    --min-sdk-version "$3" --target-sdk-version 34 "$B/res/res.zip" ${EXTRA[@]+"${EXTRA[@]}"}

  javac -source 8 -target 8 -bootclasspath "$JAR" -Xlint:-options -encoding UTF-8 \
    -d "$B/classes" $(find app/src "$B/gen" -name '*.java')
  "$BT/d8" --release --min-api "$3" --lib "$JAR" --output "$B/dex" $(find "$B/classes" -name '*.class')

  cp "$B/unsigned.apk" "$B/with-dex.apk"
  (cd "$B/dex" && zip -qj ../with-dex.apk classes.dex)
  "$BT/zipalign" -f -p 4 "$B/with-dex.apk" "$B/aligned.apk"
  # v1 (JAR) + v2 only. v1: some head-unit installers and file managers only read that one.
  # No v3: Android 9 checks v3 first when present, and some head-unit ROMs fail on it ("problem
  # parsing the package"); v3 is only needed to rotate signing keys, which these apps don't do.
  "$BT/apksigner" sign --ks "$KS" --ks-pass "pass:$PASS" --key-pass "pass:$PASS" --ks-key-alias "$ALIAS" \
    --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled false --v4-signing-enabled false \
    --out "$APK" "$B/aligned.apk"
  "$BT/apksigner" verify --min-sdk-version "$3" "$APK"
  echo "Built $APK ($(du -h "$APK" | cut -f1))"
  [ -n "${BUNDLETOOL:-}" ] && bundle "$@"
  return 0
}

# bundle <same arguments as build>: the same app as an Android App Bundle (.aab) for Google Play,
# signed with the same key (Play re-signs it with the app signing key it holds).
# Needs BUNDLETOOL=path/to/bundletool-all.jar; uses the dex and compiled resources build() made.
bundle() {
  local B=$OUT/build-$1 AAB=$OUT/${4%.apk}.aab EXTRA=() ASSETS=(-A app/assets)
  if [ -n "${5:-}" ]; then EXTRA=(-R "$B/res/extra.zip" --auto-add-overlay); [ "${6:-}" = assets ] || ASSETS=(); fi
  rm -rf "$B/base" "$B/base.zip" "$B/proto.zip"
  # Google Play updates its apps itself: no in-app updater (its permission) in the bundle.
  grep -v 'android.permission.REQUEST_INSTALL_PACKAGES' "$2" > "$B/play-manifest.xml"
  "$BT/aapt2" link --proto-format -o "$B/proto.zip" -I "$JAR" \
    --manifest "$B/play-manifest.xml" ${ASSETS[@]+"${ASSETS[@]}"} \
    --min-sdk-version "$3" --target-sdk-version 34 "$B/res/res.zip" ${EXTRA[@]+"${EXTRA[@]}"}
  mkdir -p "$B/base/manifest" "$B/base/dex"
  (cd "$B/base" && unzip -q ../proto.zip && mv AndroidManifest.xml manifest/)
  cp "$B/dex/classes.dex" "$B/base/dex/"
  (cd "$B/base" && zip -qr ../base.zip .)
  java -jar "$BUNDLETOOL" build-bundle --modules="$B/base.zip" --output="$AAB" --overwrite
  jarsigner -keystore "$KS" -storepass "$PASS" -keypass "$PASS" -sigalg SHA256withRSA -digestalg SHA-256 "$AAB" "$ALIAS" >/dev/null
  jarsigner -verify "$AAB" >/dev/null
  echo "Built $AAB ($(du -h "$AAB" | cut -f1))"
}

mkdir -p "$OUT"
case "${1:-all}" in
  tv)  build tv app/AndroidManifest.xml 28 mk-tv-launcher.apk ;;
  car) build car car/AndroidManifest.xml 26 mk-car-launcher.apk ;;
  phone) build phone phone/AndroidManifest.xml 26 mk-phone-launcher.apk phone/res assets ;;
  helper) build helper helper/AndroidManifest.xml 24 mk-split-helper.apk helper/res ;;
  all) build tv app/AndroidManifest.xml 28 mk-tv-launcher.apk
       build car car/AndroidManifest.xml 26 mk-car-launcher.apk
       build phone phone/AndroidManifest.xml 26 mk-phone-launcher.apk phone/res assets
       build helper helper/AndroidManifest.xml 24 mk-split-helper.apk helper/res ;;
  *)   echo "usage: ./build.sh [tv|car|phone|helper|all]" >&2; exit 1 ;;
esac
