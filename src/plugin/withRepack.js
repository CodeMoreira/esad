const { withAppBuildGradle, withProjectBuildGradle, withMainApplication, withMainActivity, withGradleProperties, withAndroidManifest } = require('@expo/config-plugins');

/**
 * ESAD Expo Config Plugin
 * Automates native patches for Re.Pack 5 + Expo 52.
 */
const withESADRepack = (config) => {
  // 1. Disable New Architecture (Fabric) for stability with MF
  config = withGradleProperties(config, (config) => {
    config.modResults = config.modResults.map((item) => {
      if (item.key === 'newArchEnabled') {
        return { ...item, value: 'false' };
      }
      return item;
    });
    return config;
  });

  // 2. Adjust root build.gradle (Kotlin 1.9.25 for Compose Compiler)
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = config.modResults.contents.replace(
        /kotlinVersion = findProperty\('android\.kotlinVersion'\) \?: '.+?'/,
        "kotlinVersion = findProperty('android.kotlinVersion') ?: '1.9.25'"
      );
      config.modResults.contents = config.modResults.contents.replace(
        /classpath\('org\.jetbrains\.kotlin:kotlin-gradle-plugin'\)/,
        'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")'
      );
    }
    return config;
  });

  // 3. Adjust app/build.gradle (bundleCommand and ABI Filters)
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;
      
      if (!contents.includes('bundleCommand = "repack-bundle"')) {
        contents = contents.replace(
          /react \{/,
          'react {\n    bundleCommand = "repack-bundle"\n    bundleConfig = "rspack.config.mjs"'
        );
      }

      if (!contents.includes('abiFilters')) {
        contents = contents.replace(
          /defaultConfig \{/,
          'defaultConfig {\n        ndk {\n            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"\n        }'
        );
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  // 4. Android Manifest (Cleartext Traffic for Dev Server)
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });

  // 5. MainApplication (JS Main Module Name)
  config = withMainApplication(config, (config) => {
    if (config.modResults.language === 'kotlin' || config.modResults.language === 'kt') {
      config.modResults.contents = config.modResults.contents.replace(
        /getJSMainModuleName\(\): String = .*/,
        'getJSMainModuleName(): String = "index"'
      );
    }
    return config;
  });

  // 6. MainActivity (Main Component Name Sync)
  config = withMainActivity(config, (config) => {
    if (config.modResults.language === 'kotlin' || config.modResults.language === 'kt') {
      config.modResults.contents = config.modResults.contents.replace(
        /getMainComponentName\(\): String = .*/,
        `getMainComponentName(): String = "${config.name}"`
      );
    }
    return config;
  });

  return config;
};

module.exports = withESADRepack;
