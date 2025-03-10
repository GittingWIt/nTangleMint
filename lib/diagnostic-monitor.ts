type DiagnosticEvent = {
  type: "button_click" | "dropdown_open" | "item_select"
  component: string
  timestamp: number
  success: boolean
  error?: Error
}

class DiagnosticMonitor {
  private events: DiagnosticEvent[] = []

  logEvent(event: Omit<DiagnosticEvent, "timestamp">) {
    const fullEvent = {
      ...event,
      timestamp: Date.now(),
    }

    this.events.push(fullEvent)

    if (!event.success) {
      console.error("Diagnostic test failure:", event)
    }

    // In a real app, you might want to send this to your analytics service
    if (process.env.NODE_ENV === "production") {
      // this.sendToAnalytics(fullEvent)
    }
  }

  getEvents() {
    return [...this.events]
  }

  clear() {
    this.events = []
  }
}

export const diagnosticMonitor = new DiagnosticMonitor()