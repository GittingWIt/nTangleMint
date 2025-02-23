"use client"

import ClientLayout from "@/components/ClientLayout"
import type React from "react"

export default function Template({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}