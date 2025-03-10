// lib/debug.ts
const IS_BROWSER = typeof window !== "undefined"

export const debug = (...args: any[]) => {
  if (IS_BROWSER && process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}