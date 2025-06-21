import ClientMerchantProfile from "./client-merchant-profile"

export default function MerchantProfileServerPage({ params }: { params: { address: string } }) {
  return <ClientMerchantProfile params={params} />
}