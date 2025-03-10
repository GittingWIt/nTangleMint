"use client"

import React from "react"

// Log component render lifecycle
export function withRenderLogging<P extends object>(Component: React.ComponentType<P>, name: string): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    React.useEffect(() => {
      console.log(`[RENDER] ${name} mounted`)
      return () => console.log(`[RENDER] ${name} unmounted`)
    }, [])

    console.log(`[RENDER] ${name} rendering with props:`, props)
    return <Component {...props} />
  }

  WrappedComponent.displayName = `LoggedRender(${name})`
  return WrappedComponent
}