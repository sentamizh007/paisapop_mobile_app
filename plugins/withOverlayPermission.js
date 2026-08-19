/**
 * withOverlayPermission.js
 *
 * Expo Config Plugin — adds SYSTEM_ALERT_WINDOW permission and
 * a Theme.Overlay style so the Quick-Add card floats over the
 * Android wallpaper (not a black background).
 *
 * KEY FIX: android:windowShowWallpaper=true tells Android OS to
 * render the actual phone wallpaper behind the transparent window.
 * Without this flag, Android shows BLACK even when transparent=true.
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// 1. Add SYSTEM_ALERT_WINDOW permission
function withSystemAlertWindowPermission(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const permissions = manifest.manifest['uses-permission'] || [];
    const alreadyAdded = permissions.some(
      (p) => p.$?.['android:name'] === 'android.permission.SYSTEM_ALERT_WINDOW'
    );
    if (!alreadyAdded) {
      manifest.manifest['uses-permission'] = [
        ...permissions,
        { $: { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' } },
      ];
    }
    return cfg;
  });
}

// 2. Inject wallpaper-transparent overlay style into styles.xml
function withTranslucentStyle(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const stylesPath = path.join(
        cfg.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'values', 'styles.xml'
      );
      if (!fs.existsSync(stylesPath)) {
        console.warn('[withOverlayPermission] styles.xml not found');
        return cfg;
      }
      let content = fs.readFileSync(stylesPath, 'utf8');

      // Remove old Theme.Overlay block if exists (to re-inject updated one)
      if (content.includes('Theme.Overlay')) {
        content = content.replace(
          /\n?\s*<style name="Theme\.Overlay"[\s\S]*?<\/style>/,
          ''
        );
      }

      // Inject updated style with windowShowWallpaper=true (THE KEY FIX)
      const overlayStyle = `
    <!-- Wallpaper overlay theme for Quick Add floating card -->
    <style name="Theme.Overlay" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowIsTranslucent">true</item>
        <item name="android:windowBackground">@android:color/transparent</item>
        <item name="android:windowShowWallpaper">true</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:backgroundDimEnabled">false</item>
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    </style>`;

      content = content.replace('</resources>', overlayStyle + '\n</resources>');
      fs.writeFileSync(stylesPath, content, 'utf8');
      console.log('[withOverlayPermission] Injected Theme.Overlay with windowShowWallpaper=true');
      return cfg;
    },
  ]);
}

// 3. Set MainActivity to use Theme.Overlay
function withMainActivityOverlayTheme(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = manifest.manifest.application?.[0];
    if (!app) return cfg;
    const activities = app.activity || [];
    const main = activities.find(
      (a) => a.$?.['android:name']?.endsWith('MainActivity')
    );
    if (main) {
      main.$['android:theme'] = '@style/Theme.Overlay';
    }
    return cfg;
  });
}

module.exports = function withOverlayPermission(config) {
  config = withSystemAlertWindowPermission(config);
  config = withTranslucentStyle(config);
  config = withMainActivityOverlayTheme(config);
  return config;
};
