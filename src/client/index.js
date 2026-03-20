import { useState, useEffect } from 'react';

/**
 * ESAD Global Event Manager
 * This class runs as a true Singleton across the Host and all Federated Modules,
 * allowing instant variable sharing without tight coupling.
 */
class ESADEventEmitter {
  constructor() {
    this.state = {};
    this.listeners = {};
  }

  set(key, value) {
    this.state[key] = value;
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(value));
    }
  }

  get(key) {
    return this.state[key];
  }

  subscribe(key, callback) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(callback);
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }
}

// Because this package is marked as a ModuleFederation Singleton,
// this instance will be shared identically across all chunks!
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
