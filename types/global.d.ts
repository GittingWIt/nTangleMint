// types/global.d.ts
interface Window {
  __refreshLoopFixed?: boolean
  s?: (() => void) | undefined
  o?: (() => void) | undefined
  initProgramCreationHooks?: (() => void) | undefined
}

// Global function declarations to prevent minification issues
declare global {
  var s: (() => void) | undefined
  var o: (() => void) | undefined
  var initProgramCreationHooks: (() => void) | undefined
}

export {}