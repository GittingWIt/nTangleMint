import "@/lib/global-functions"

export default function CreateProgramPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Create New Program</h1>
          <p className="text-muted-foreground">Choose the type of loyalty program you want to create.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Punch Card Program</h2>
            <p className="text-muted-foreground">
              Traditional punch card where customers collect stamps for purchases and earn rewards.
            </p>
            <a
              href="/merchant/create-program/punch-card"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Create Punch Card
            </a>
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Coupon Book Program</h2>
            <p className="text-muted-foreground">
              Digital coupon book with multiple discount offers for your customers.
            </p>
            <a
              href="/merchant/create-program/coupon-book"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Create Coupon Book
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}