import type React from "react"
import { PackageChecker } from "@/components/package-checker"

export default function DiagnosticLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">React 19 Compatibility Diagnostic</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">{children}</div>
        <div className="space-y-6">
          <PackageChecker />
          <div className="p-4 border rounded-md bg-blue-50">
            <h2 className="text-lg font-semibold mb-2">Common Issues</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Ref Handling:</strong> React 19 changed how refs work - they're now regular props
              </li>
              <li>
                <strong>Button Nesting:</strong> HTML doesn't allow button elements inside other buttons
              </li>
              <li>
                <strong>asChild Pattern:</strong> Make sure to use asChild correctly with Radix UI components
              </li>
              <li>
                <strong>Package Versions:</strong> Ensure all packages are compatible with React 19
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}