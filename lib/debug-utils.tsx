"use client"

import * as React from "react"

// Helper component to inspect component props and refs
export function DebugComponent({
  component: Component,
  props,
  name,
}: {
  component: React.ComponentType<any>
  props: any
  name: string
}) {
  const ref = React.useRef(null)

  React.useEffect(() => {
    console.log(`[DEBUG] ${name} ref:`, ref.current)
    console.log(`[DEBUG] ${name} props:`, props)
  }, [name, props])

  return <Component {...props} ref={ref} />
}

// Utility to check if a component is forwarding refs correctly
export function checkRefForwarding(Component: React.ComponentType<any>, name: string) {
  const TestComponent = React.forwardRef((props, ref) => {
    React.useEffect(() => {
      console.log(`[REF-TEST] ${name} ref received:`, ref)
    }, [ref, name]) // Added 'name' to dependencies

    return <Component {...props} ref={ref} />
  })

  TestComponent.displayName = `RefTest(${name})`
  return TestComponent
}

// Log component render lifecycle
export function withRenderLogging<P>(Component: React.ComponentType<P>, name: string) {
  const WrappedComponent = (props: P) => {
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