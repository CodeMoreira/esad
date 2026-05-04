/**
 * ESAD Runtime Environment Polyfill
 * This file is injected at the very beginning of the bundle to ensure
 * that Expo and React Navigation find the expected environment variables.
 */
if (typeof global !== 'undefined') {
  global.process = global.process || {};
  global.process.env = global.process.env || {};
  
  // These values are placeholders that will be replaced by DefinePlugin
  // or set via BannerPlugin, but here we provide a safe fallback object.
  if (typeof global.process.env !== 'object' || global.process.env === null) {
    global.process.env = {};
  }
}
