/**
 * withOverlayPermission.js
 *
 * Expo Config Plugin - adds SYSTEM_ALERT_WINDOW permission and
 * a Theme.Overlay style so the Quick-Add card floats over the
 * Android wallpaper (not a black background).
 *
 * KEY FIXES:
 * 1. Plugin is now registered in app.json (was missing before - root cause)
 * 2. android:windowShowWallpaper=true - renders actual wallpaper behind window
 * 3. android:windowIsTranslucent=true - makes window transparent
 * 4. android:backgroundDimEnabled=false - prevents Android darkening behind
 * 5. windowIsFloating=false - full screen overlay, not a floating dialog
 * 6. showWhenLocked + turnScreenOn for lock screen support
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
      (p) => p['$'] && p['$']['android:name'] === 'android.permission.SYSTEM_ALERT_WINDOW'
    );
    if (!alreadyAdded) {
      manifest.manifest['uses-permission'] = [
        ...permissions,
        { '$': { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' } },
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
        console.warn('[withOverlayPermission] styles.xml not found at:', stylesPath);
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

      const overlayStyle = [
        '',
        '    <!-- Wallpaper overlay theme for Quick Add floating card -->',
        '    <style name="Theme.Overlay" parent="Theme.AppCompat.Light.NoActionBar">',
        '        <!-- Makes the window itself transparent -->',
        '        <item name="android:windowIsTranslucent">true</item>',
        '        <!-- No opaque background layer -->',
        '        <item name="android:windowBackground">@android:color/transparent</item>',
        '        <!-- KEY: Show actual phone wallpaper behind this window -->',
        '        <item name="android:windowShowWallpaper">true</item>',
        '        <!-- Remove title bar -->',
        '        <item name="android:windowNoTitle">true</item>',
        '        <!-- Disable dim layer Android adds behind overlays (stops black look) -->',
        '        <item name="android:backgroundDimEnabled">false</item>',
        '        <!-- Transparent status and nav bars -->',
        '        <item name="android:statusBarColor">@android:color/transparent</item>',
        '        <item name="android:navigationBarColor">@android:color/transparent</item>',
        '        <!-- Handle display cutout areas properly -->',
        '        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>',
        '        <!-- Full screen overlay, not floating dialog -->',
        '        <item name="android:windowIsFloating">false</item>',
        '    </style>',
      ].join('\n');

      content = content.replace('</resources>', overlayStyle + '\n</resources>');
      fs.writeFileSync(stylesPath, content, 'utf8');
      console.log('[withOverlayPermission] Injected Theme.Overlay with windowShowWallpaper=true');
      return cfg;
    },
  ]);
}

// 3. Set MainActivity to use Theme.Overlay + lock screen flags
function withMainActivityOverlayTheme(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const app = manifest.manifest.application && manifest.manifest.application[0];
    if (!app) return cfg;
    const activities = app.activity || [];
    const main = activities.find(
      (a) => a['$'] && a['$']['android:name'] && a['$']['android:name'].endsWith('MainActivity')
    );
    if (main) {
      main['$']['android:theme'] = '@style/Theme.Overlay';
      main['$']['android:showWhenLocked'] = 'true';
      main['$']['android:turnScreenOn'] = 'true';
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