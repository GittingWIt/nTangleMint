/**
 * Grid Layout Calculator for Punch Cards
 *
 * Calculates the optimal symmetrical grid layout based on total punch blocks.
 * Per spec: "If the number of Punch Blocks is being set at 6, I would expect
 * the Punch Card to be 3 Punch Blocks Length by 2 Punch Blocks Width."
 *
 * nTwined Block = upper-left (index 0)
 * Redeemed Block = lower-right (last index)
 */

export interface GridLayout {
  columns: number
  rows: number
  totalBlocks: number
  nTwinedPosition: { row: number; col: number }
  redeemedPosition: { row: number; col: number }
}

/**
 * Calculate optimal grid dimensions for a given number of blocks
 * Prioritizes symmetry and balanced aspect ratios
 */
export function calculateGridLayout(totalBlocks: number): GridLayout {
  // Special cases for small numbers
  if (totalBlocks <= 1) {
    return {
      columns: 1,
      rows: 1,
      totalBlocks: 1,
      nTwinedPosition: { row: 0, col: 0 },
      redeemedPosition: { row: 0, col: 0 },
    }
  }

  if (totalBlocks === 2) {
    // nBOGO case: 2 blocks side by side
    return {
      columns: 2,
      rows: 1,
      totalBlocks: 2,
      nTwinedPosition: { row: 0, col: 0 },
      redeemedPosition: { row: 0, col: 1 },
    }
  }

  // Find the most balanced grid (closest to square)
  let bestColumns = totalBlocks
  let bestRows = 1
  let bestDiff = totalBlocks - 1

  for (let cols = 2; cols <= Math.ceil(Math.sqrt(totalBlocks * 2)); cols++) {
    if (totalBlocks % cols === 0) {
      const rows = totalBlocks / cols
      const diff = Math.abs(cols - rows)
      // Prefer wider layouts (cols >= rows) for card aesthetics
      if (diff < bestDiff || (diff === bestDiff && cols > rows)) {
        bestColumns = cols
        bestRows = rows
        bestDiff = diff
      }
    }
  }

  // If no perfect fit, find closest that works
  if (bestRows === 1 && totalBlocks > 3) {
    // Try to find a reasonable grid even if not perfectly divisible
    for (let cols = Math.ceil(Math.sqrt(totalBlocks)); cols >= 2; cols--) {
      const rows = Math.ceil(totalBlocks / cols)
      if (cols * rows >= totalBlocks) {
        bestColumns = cols
        bestRows = rows
        break
      }
    }
  }

  return {
    columns: bestColumns,
    rows: bestRows,
    totalBlocks,
    nTwinedPosition: { row: 0, col: 0 }, // Upper-left
    redeemedPosition: { row: bestRows - 1, col: bestColumns - 1 }, // Lower-right
  }
}

/**
 * Get the grid position (row, col) for a block index
 */
export function getBlockPosition(index: number, layout: GridLayout): { row: number; col: number } {
  const row = Math.floor(index / layout.columns)
  const col = index % layout.columns
  return { row, col }
}

/**
 * Check if a position is the nTwined block position
 */
export function isNTwinedPosition(row: number, col: number, layout: GridLayout): boolean {
  return row === layout.nTwinedPosition.row && col === layout.nTwinedPosition.col
}

/**
 * Check if a position is the Redeemed block position
 */
export function isRedeemedPosition(row: number, col: number, layout: GridLayout): boolean {
  return row === layout.redeemedPosition.row && col === layout.redeemedPosition.col
}

/**
 * Get Tailwind grid classes for a layout
 */
export function getGridClasses(layout: GridLayout): string {
  const colsMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  }
  return colsMap[layout.columns] || `grid-cols-${layout.columns}`
}

/**
 * Preset layouts for common block counts
 */
export const PRESET_LAYOUTS: Record<number, { columns: number; rows: number; description: string }> = {
  2: { columns: 2, rows: 1, description: "nBOGO (Buy One Get One)" },
  3: { columns: 3, rows: 1, description: "Quick Reward" },
  4: { columns: 2, rows: 2, description: "Standard Square" },
  5: { columns: 5, rows: 1, description: "Five Punch" },
  6: { columns: 3, rows: 2, description: "Classic Six" },
  8: { columns: 4, rows: 2, description: "Extended Eight" },
  9: { columns: 3, rows: 3, description: "Premium Nine" },
  10: { columns: 5, rows: 2, description: "Ten Punch Special" },
  12: { columns: 4, rows: 3, description: "Deluxe Twelve" },
}