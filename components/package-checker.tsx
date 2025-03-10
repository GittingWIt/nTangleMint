"use client"

import { useEffect, useState } from "react"

interface PackageVersions {
  react: string
  nextjs: string
  radixUI: {
    dropdown: string
    slot: string
  }
}

export function PackageChecker() {
  const [versions, setVersions] = useState<PackageVersions>({
    react: "Unknown",
    nextjs: "Unknown",
    radixUI: {
      dropdown: "Unknown",
      slot: "Unknown",
    },
  })

  useEffect(() => {
    // Get versions from environment variables
    setVersions({
      react: process.env.NEXT_PUBLIC_REACT_VERSION || "Unknown",
      nextjs: process.env.NEXT_PUBLIC_NEXT_VERSION || "Unknown",
      radixUI: {
        dropdown: process.env.NEXT_PUBLIC_RADIX_DROPDOWN_VERSION || "Unknown",
        slot: process.env.NEXT_PUBLIC_RADIX_SLOT_VERSION || "Unknown",
      },
    })
  }, [])

  return (
    <div className="p-4 border rounded-md bg-slate-50">
      <h2 className="text-lg font-semibold mb-4">Package Versions</h2>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <span className="text-sm font-medium">React:</span>
          <span className="text-sm font-mono">{versions.react}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <span className="text-sm font-medium">Next.js:</span>
          <span className="text-sm font-mono">{versions.nextjs}</span>
        </div>
        <div className="mt-4">
          <span className="text-sm font-medium">Radix UI:</span>
          <div className="ml-4 mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-sm">@radix-ui/react-dropdown-menu:</span>
              <span className="text-sm font-mono">{versions.radixUI.dropdown}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-sm">@radix-ui/react-slot:</span>
              <span className="text-sm font-mono">{versions.radixUI.slot}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <h3 className="text-sm font-semibold mb-2">Required Versions</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>React: ^19.0.0</li>
          <li>Next.js: ^15.0.0</li>
          <li>@radix-ui/react-dropdown-menu: ^2.0.6</li>
          <li>@radix-ui/react-slot: ^1.0.2</li>
        </ul>
      </div>

      {(versions.react === "Unknown" || versions.nextjs === "Unknown") && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <strong>Note:</strong> Some version information is unavailable. Please check your environment variables and
          package.json file.
        </div>
      )}
    </div>
  )
}