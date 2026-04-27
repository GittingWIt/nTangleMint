// Re-export all utilities for convenient importing
export { cn } from "./cn"
export { debug, generateId, formatCurrency, truncateText, safeJsonParse, delay, isBrowser } from "./common"
export {
  safeLocalStorage,
  safeSessionStorage,
  hasLocalStorage,
  hasSessionStorage,
  isMobileDevice,
  getDeviceType,
} from "./browser"
export {
  normalizeDate,
  toStorageFormat,
  areSameDates,
  formatDisplayDate,
  formatCardDate,
  getRemainingDays,
  isExpired,
  getDaysUntilExpiration,
  sanitizeDateForStorage,
} from "./date"