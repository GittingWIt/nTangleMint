import type { Config } from "jest"

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^@/types/(.*)$": "<rootDir>/types/$1",
    "^@/styles/(.*)$": "<rootDir>/styles/$1",
    "^@/bsvUtilities/(.*)$": "<rootDir>/bsvUtilities/$1",
  },
  testMatch: ["**/app/test-bsv/**/*.test.ts", "**/app/test-bsv/**/*.test.tsx", "**/__tests__/**/*.[jt]s?(x)"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
}

export default config