import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private storage: Storage | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.storage = window.localStorage;
    }
  }

  setItem<T>(key: string, value: T): void {
    if (!this.storage) return;
    try {
      const serializedValue = JSON.stringify(value);
      this.storage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }

  getItem<T>(key: string): T | null {
    if (!this.storage) return null;
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return null;
    }
  }

  removeItem(key: string): void {
    if (!this.storage) return;
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage', error);
    }
  }

  clear(): void {
    if (!this.storage) return;
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  }
}
