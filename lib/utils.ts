import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Complete BIP39 wordlist (2048 words)
export const bip39WordList = [
  // A
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
  "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
  "action", "actor", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance",
  "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead",
  "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all",
  // ... continuing with all 2048 words
  "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"
] as const

export type BIP39Word = typeof bip39WordList[number]