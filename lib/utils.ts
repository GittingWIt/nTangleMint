import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Type-safe event handler
export function createEventHandler<T extends Event>(handler: (event: T) => void) {
  return handler as EventListener
}

// Storage event wrapper
export function createStorageListener<T>(key: string, callback: (data: T | null) => void) {
  return () => {
    try {
      const data = localStorage.getItem(key)
      callback(data ? JSON.parse(data) : null)
    } catch (error) {
      console.error(`Error handling storage event for ${key}:`, error)
      callback(null)
    }
  }
}