import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility for handling React 19 refs safely
export function createForwardRef<T, P extends object>(
  render: (props: P, ref: React.Ref<T>) => React.ReactElement | null,
) {
  return React.forwardRef<T, P>(render)
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