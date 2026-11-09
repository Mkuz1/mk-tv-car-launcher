# Google Play listing: MK Car Launcher (com.mk.carlauncher)

Copy each part into Play Console → Grow → Store presence → Main store listing, and the
"What's new" text into the release (Release → Production → Create new release → Release notes).

## App name (max 30 characters)

MK Car Launcher

## Short description (max 80 characters)

English: A Liquid Glass home screen for car head units: map, music, prayer times, azkar
Arabic: واجهة سيارة بتصميم زجاجي: خريطة، موسيقى، مواقيت الصلاة، أذكار ونقل ملفات

## Full description (max 4000 characters)

MK Car Launcher turns your Android car head unit into a calm, beautiful home screen in Liquid Glass, made for touch and for driving, in English or Arabic.

DRIVE SCREEN, LIKE CARPLAY
Swipe left from Home for a big Google map around your car with your speed and one-tap Home, Work, nearest mosque and petrol station in Google Maps, next to Now Playing for whatever plays in any app: YouTube, YouTube Music, Spotify, Anghami, podcasts or radio, with cover, progress and large play, next and previous buttons.

CONTROL CENTER
Swipe down or tap the sidebar button for an iPhone-style Control Center with big buttons: your notifications (open, dismiss, clear), Wi‑Fi and Bluetooth switches, tall brightness and volume sliders, day, eye comfort and night modes, Cast and File Transfer.

FILE TRANSFER FROM YOUR PHONE
Scan a QR code with your phone's camera to browse the car's storage and USB sticks in your browser: upload photos, videos, music and files into any folder, download, make folders, rename and delete. It works over your phone's hotspot or the car's own Wi‑Fi, runs only while you switch it on, and uses a new key every time.

PRAYER TIMES, AZKAR AND QIBLA
Prayer times for wherever the car is (from its GPS, with the official method of each country), a gentle silent banner before and at each prayer, morning, evening and general azkar from Hisn al-Muslim, the travel dua when a trip starts, Hijri date, Friday Al-Kahf and White Days reminders, and a Qibla compass that turns with the car.

APPS YOUR WAY
A sidebar with the apps you choose, an app drawer with folders, moving, hiding and deleting apps, split screen for two apps side by side, and Cast to open the AirPlay or Google Cast receiver app on your head unit.

MADE FOR THE ROAD
Large touch targets, automatic night mode at Maghrib, a smooth interface with no heavy effects, and a layout that fits any screen, from 1024×600 to wide 1920×720 panels.

Optional: MK Car Helper (a separate small app) adds split screen, Now Playing details and notifications. It uses Android's accessibility and notification access only for those features and reads nothing else on the screen.

## What's new (max 500 characters per language)

<en-US>
• Drive screen: swipe left for a big Google map with Now Playing for any app
• Control Center in Liquid Glass: notifications, Wi‑Fi, Bluetooth, brightness, volume, night mode
• File Transfer: scan a QR code to upload files from your phone into the car's folders
• Cast to the head unit's AirPlay / Google Cast receiver app
• Split screen closes cleanly after Home
• Cleaner home page; Qibla button by the clock
</en-US>
<ar>
• شاشة القيادة: اسحب لليسار لخريطة Google كبيرة مع التحكم بالموسيقى
• مركز التحكم بالتصميم الزجاجي: الإشعارات وWi‑Fi والبلوتوث والسطوع والصوت والوضع الليلي
• نقل الملفات: امسح رمز QR لرفع الملفات من هاتفك إلى مجلدات السيارة
• البث إلى تطبيق استقبال AirPlay وGoogle Cast في الشاشة
• إغلاق تقسيم الشاشة بشكل سليم بعد زر الرئيسية
• صفحة رئيسية أنظف وزر القبلة بجانب الساعة
</ar>

## Before publishing on Google Play

- Upload `mk-car-launcher-v2.8.1.aab` from the GitHub release (Release → Production → Create new release).
- Play App Signing: the bundle is signed with the same key as the APKs; enrol it as your upload key.
- Target API: the apps target Android 14 (API 34). If Play Console asks for a newer target level, ask for the target to be raised before uploading.
- Permissions Play will ask about: location (prayer times, map, Qibla), "Modify system settings" (brightness), storage (File Transfer), and REQUEST_DELETE_PACKAGES (Delete in the app menu). MK Car Helper's accessibility and notification access need the Accessibility API declaration if you publish the helper too.
