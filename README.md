# OneUp 🚀

**OneUp** is a modern, gamified push-up tracker designed to help you build a habit of daily exercise.
Built with **Vibe Coding**.

## ✨ Features

- 📈 **Progressive Challenge**: Start with 1 push-up, increase daily up to 365
- 📅 **Calendar View**: Track your progress throughout the year
- 📊 **Statistics**: View your completion rate, streaks, and time-of-day preferences
- 🔔 **Daily Notifications**: Customizable reminders to stay on track
- 🎵 **Sound Effects**: Engaging audio feedback for achievements
- ☁️ **Cloud Sync**: Save your progress to Google Play and sync across devices (Firebase)
- 🌍 **Multi-language**: Supports English and French
- 📱 **Native Android App**: Full mobile experience with Capacitor

## 📱 Mobile App (Android)

OneUp is available as a native Android application!

### How to Install (User)
1.  **Download the APK**: Get the `OneUp.apk` file.
2.  **Allow Unknown Sources**: On your phone, if prompted, allow installation from your file manager or browser.
3.  **Install**: Open the APK file and tap "Install".

---

## 🛠️ Installation (Developer)

If you want to build the app yourself or contribute:

### Prerequisites
- Node.js installed.
- Android Studio installed (for mobile build).

### Setup
1.  **Clone the repository**
    ```bash
    git clone https://github.com/LucasM548/OneUp.git
    cd OneUp
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Web Version** (Local Development)
    ```bash
    npm run dev
    ```

### ☁️ Cloud Sync Setup

To enable cloud synchronization with Google Play:

1. Follow the detailed setup guide in [`CLOUD_SETUP.md`](./CLOUD_SETUP.md)
2. Configure Firebase and Realtime Database
3. Update the Firebase credentials in `src/services/cloudSync.js`

### 🤖 Build for Android

1.  **Build the Web Assets**
    ```bash
    npm run build
    ```

2.  **Sync with Capacitor**
    ```bash
    npx cap sync
    ```

3.  **Open in Android Studio**
    ```bash
    npx cap open android
    ```
    - Once Android Studio opens, wait for Gradle to sync.
    - Connect your phone via USB.
    - Click the **Run (Play)** button to install on your device.

---

## 🏗️ Built With
- **React + Vite** - Fast web framework.
- **Capacitor** - Cross-platform native runtime.
- **Firebase** - Cloud sync and authentication.
- **Tailwind-free** - Custom CSS for maximum style control.
