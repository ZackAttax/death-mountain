# Capacitor Native Setup Guide

This guide contains the manual configuration steps needed after running `npx cap add ios` and `npx cap add android`.

## Prerequisites

After installing dependencies and adding platforms, run:
```bash
cd client
pnpm install
npx cap add ios
npx cap add android
```

## iOS Configuration

After running `npx cap add ios`, update `ios/App/App/Info.plist`:

Add the following URL scheme configuration inside the `<dict>` tag (usually near the top, after `<key>CFBundleDevelopmentRegion</key>`):

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>myapp</string>
        </array>
    </dict>
</array>
```

## Android Configuration

After running `npx cap add android`, update `android/app/src/main/AndroidManifest.xml`:

1. Set `MainActivity` launch mode to `singleTask`:
   - Find the `<activity>` tag with `android:name=".MainActivity"`
   - Add or update: `android:launchMode="singleTask"`

2. Add intent-filter for deep links inside the `<activity>` tag:
   ```xml
   <intent-filter>
       <action android:name="android.intent.action.VIEW" />
       <category android:name="android.intent.category.DEFAULT" />
       <category android:name="android.intent.category.BROWSABLE" />
       <data android:scheme="myapp" android:host="open" />
   </intent-filter>
   ```

## Build Commands

- `pnpm run mobile:build` - Build web app and copy to native projects
- `pnpm run mobile:ios` - Build and open iOS project in Xcode
- `pnpm run mobile:android` - Build and open Android project in Android Studio

## Manual Steps After Platform Setup

1. **iOS**: Update bundle identifier in Xcode from `com.example.game` to your actual bundle ID
2. **iOS**: Configure signing certificates in Xcode
3. **Android**: Update package name in `android/app/build.gradle` from `com.example.game` to your actual package name
4. **Android**: Configure signing in `android/app/build.gradle`
