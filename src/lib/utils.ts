import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId() {
  return (
    crypto.randomUUID?.() ??
    window.crypto.getRandomValues(new Uint32Array(4)).join('-')
  );
}
