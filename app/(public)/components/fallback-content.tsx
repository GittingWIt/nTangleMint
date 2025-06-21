export function FallbackContent() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Welcome to TangleMint</h1>
        <p className="text-lg max-w-2xl mx-auto">
          Discover loyalty programs and special offers from your favorite merchants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="border rounded-lg p-6 text-center">
          <h3 className="font-semibold text-lg mb-2">Loyalty Programs</h3>
          <p>Earn rewards with every purchase from participating merchants.</p>
        </div>

        <div className="border rounded-lg p-6 text-center">
          <h3 className="font-semibold text-lg mb-2">Digital Coupons</h3>
          <p>Save money with exclusive digital coupons and offers.</p>
        </div>

        <div className="border rounded-lg p-6 text-center">
          <h3 className="font-semibold text-lg mb-2">Secure Wallet</h3>
          <p>Manage all your rewards in one secure digital wallet.</p>
        </div>
      </div>
    </div>
  )
}