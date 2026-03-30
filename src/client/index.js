import { useState, useEffect } from 'react';

/**
 * ESAD Global Event Manager
 * This class runs as a true Singleton across the Host and all Federated Modules,
 * allowing instant variable sharing without tight coupling.
 */
// Unique key to store the global state in the environment (shared across sessions)
const GLOBAL_STORE_KEY = '__ESAD_GLOBAL_STATE__';

// Initialize the global store if it doesn't already exist.
// This ensures that even if different chunks/modules have their own copy 
// of this JS file, they all point to the same memory object in globalThis.
if (!globalThis[GLOBAL_STORE_KEY]) {
  globalThis[GLOBAL_STORE_KEY] = {
    state: {},
    listeners: {}
  };
}

const GlobalStore = globalThis[GLOBAL_STORE_KEY];

class ESADEventEmitter {
  set(key, value) {
    GlobalStore.state[key] = value;
    if (GlobalStore.listeners[key]) {
      GlobalStore.listeners[key].forEach(callback => callback(value));
    }
  }

  get(key) {
    return GlobalStore.state[key];
  }

  subscribe(key, callback) {
    if (!GlobalStore.listeners[key]) {
      GlobalStore.listeners[key] = [];
    }
    GlobalStore.listeners[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      GlobalStore.listeners[key] = GlobalStore.listeners[key].filter(cb => cb !== callback);
    };
  }
}

// Global instance (acts as a proxy to the globalStore)
const ESADState = new ESADEventEmitter();

/**
 * React Hook for subscribing to Global State Changes
 * @param {string} key Unique identifier for the state slice (e.g. 'auth_token', 'theme')
 * @param {any} initialValue Optional initial state fallback
 */
export function useESADState(key, initialValue) {
  const [val, setVal] = useState(() => {
    const existing = ESADState.get(key);
    if (existing !== undefined) return existing;
    if (initialValue !== undefined) {
      ESADState.set(key, initialValue);
      return initialValue;
    }
    return undefined;
  });

  useEffect(() => {
    // Whenever ESADState.set is called matching this key, this component will re-render
    const unsubscribe = ESADState.subscribe(key, (newVal) => {
      setVal(newVal);
    });
    return unsubscribe;
  }, [key]);

  const setter = (newVal) => {
    ESADState.set(key, newVal);
  };

  return [val, setter];
}

export { ESADState };
