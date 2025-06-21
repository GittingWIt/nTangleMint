import DashboardRouter from "./dashboard-router"

// Remove these directives from client components
// export const dynamic = "force-dynamic"
// export const revalidate = 0

export default function ProtectedIndex() {
  return <DashboardRouter />
}