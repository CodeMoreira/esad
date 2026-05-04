/**
 * ESAD Runtime Environment Shim
 * Injected at the very beginning of the bundle to prevent "TypeError: right operand of 'in' is not an object"
 */
if (typeof process === 'undefined') {
  // Use globalThis for modern JS environments (Hermes/V8)
  const globalObj = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : {});
  globalObj.process = { env: {} };
} else if (!process.env) {
  process.env = {};
}

// These placeholders are replaced by Rspack's DefinePlugin during build time
process.env.EXPO_OS = '__EXPO_OS__';
process.env.NODE_ENV = '__NODE_ENV__';
process.env.REPACK_PLATFORM = '__REPACK_PLATFORM__';
