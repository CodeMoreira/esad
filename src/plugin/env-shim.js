/**
 * ESAD Runtime Environment Shim
 * Injected at the very beginning of the bundle to prevent "TypeError: right operand of 'in' is not an object"
 */
var g = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : this);
if (!g['process']) {
  g['process'] = {};
}
if (!g['process']['env']) {
  g['process']['env'] = {};
}

g['process']['env']['EXPO_OS'] = '__EXPO_OS__';
g['process']['env']['NODE_ENV'] = '__NODE_ENV__';
g['process']['env']['REPACK_PLATFORM'] = '__REPACK_PLATFORM__';


