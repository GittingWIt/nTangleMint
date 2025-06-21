"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Since we don't have @radix-ui/react-collapsible installed, let's create a simple collapsible component
interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  children?: React.ReactNode
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open, onOpenChange, className, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open || false)

    React.useEffect(() => {
      if (open !== undefined && open !== isOpen) {
        setIsOpen(open)
      }
    }, [open, isOpen])

    const handleOpenChange = (value: boolean) => {
      setIsOpen(value)
      onOpenChange?.(value)
    }

    return (
      <div ref={ref} className={cn("", className)} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === CollapsibleTrigger) {
              return React.cloneElement(child as React.ReactElement<any>, {
                isOpen,
                onClick: () => handleOpenChange(!isOpen),
              })
            }
            if (child.type === CollapsibleContent) {
              return React.cloneElement(child as React.ReactElement<any>, {
                isOpen,
              })
            }
          }
          return child
        })}
      </div>
    )
  },
)
Collapsible.displayName = "Collapsible"

interface CollapsibleTriggerProps {
  asChild?: boolean
  isOpen?: boolean
  onClick?: () => void
  children?: React.ReactNode
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ asChild, isOpen, onClick, children, ...props }, ref) => {
    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        ref,
        onClick,
        ...props,
      })
    }
    return (
      <button ref={ref} onClick={onClick} {...props}>
        {children}
      </button>
    )
  },
)
CollapsibleTrigger.displayName = "CollapsibleTrigger"

interface CollapsibleContentProps {
  isOpen?: boolean
  className?: string
  children?: React.ReactNode
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ isOpen, className, children, ...props }, ref) => {
    return isOpen ? (
      <div ref={ref} className={cn("overflow-hidden transition-all", className)} {...props}>
        {children}
      </div>
    ) : null
  },
)
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }