import { Dispatch, SetStateAction } from 'react';

export interface ESADEventEmitter {
  set(key: string, value: any): void;
  get(key: string): any;
  subscribe(key: string, callback: (value: any) => void): () => void;
}

export const ESADState: ESADEventEmitter;

export function useESADState<T>(key: string, initialValue?: T): [T, Dispatch<SetStateAction<T>>];
