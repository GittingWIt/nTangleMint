import { useState } from 'react'
import Layout from '../components/Layout'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Merchants() {
  const [searchContract, setSearchContract] = useState('')
  const [uploadedDesign, setUploadedDesign] = useState<string | null>(null)
  const [uploadedPunch, setUploadedPunch] = useState<string | null>(null)

  // State for program rules
  const [punchCardRules, setPunchCardRules] = useState({
    requiredPunches: 10,
    expirationDays: 365,
  })
  const [coalitionRules, setCoalitionRules] = useState({
    partnerCount: 2,
    pointsPerDollar: 1,
    expirationDays: 365,
  })
  const [tieredRules, setTieredRules] = useState({
    tiers: [
      { name: 'Bronze', pointsRequired: 0, pointMultiplier: 1, rewardMultiplier: 1 },
      { name: 'Silver', pointsRequired: 1000, pointMultiplier: 1.25, rewardMultiplier: 1.1 },
      { name: 'Gold', pointsRequired: 5000, pointMultiplier: 1.5, rewardMultiplier: 1.25 },
    ],
    expirationDays: 365,
  })

  const handleDesignUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setUploadedDesign(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handlePunchUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setUploadedPunch(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <Layout>
      <h1 className="text-4xl font-bold text-center mb-8">Where You Design Loyalty</h1>
      <div className="mb-8">
        <Input
          type="text"
          placeholder="Search for existing contract"
          value={searchContract}
          onChange={(e) => setSearchContract(e.target.value)}
          className="mb-4"
        />
        <Button>Search</Button>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Program Rules</CardTitle>
          <CardDescription>Set up the rules for your loyalty program</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="punchCard">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="punchCard">Punch Card</TabsTrigger>
              <TabsTrigger value="coalition">Coalition</TabsTrigger>
              <TabsTrigger value="tiered">Tiered</TabsTrigger>
            </TabsList>
            <TabsContent value="punchCard">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="requiredPunches">Required Punches</Label>
                  <Input
                    id="requiredPunches"
                    type="number"
                    value={punchCardRules.requiredPunches}
                    onChange={(e) =>
                      setPunchCardRules({ ...punchCardRules, requiredPunches: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="punchCardExpiration">Expiration (days)</Label>
                  <Input
                    id="punchCardExpiration"
                    type="number"
                    value={punchCardRules.expirationDays}
                    onChange={(e) =>
                      setPunchCardRules({ ...punchCardRules, expirationDays: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="coalition">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="partnerCount">Number of Partners</Label>
                  <Input
                    id="partnerCount"
                    type="number"
                    value={coalitionRules.partnerCount}
                    onChange={(e) => setCoalitionRules({ ...coalitionRules, partnerCount: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="pointsPerDollar">Points per Dollar</Label>
                  <Input
                    id="pointsPerDollar"
                    type="number"
                    value={coalitionRules.pointsPerDollar}
                    onChange={(e) =>
                      setCoalitionRules({ ...coalitionRules, pointsPerDollar: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="coalitionExpiration">Expiration (days)</Label>
                  <Input
                    id="coalitionExpiration"
                    type="number"
                    value={coalitionRules.expirationDays}
                    onChange={(e) =>
                      setCoalitionRules({ ...coalitionRules, expirationDays: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="tiered">
              <div className="space-y-4">
                {tieredRules.tiers.map((tier, index) => (
                  <div key={index} className="space-y-2">
                    <Label>{tier.name} Tier</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        placeholder="Points Required"
                        value={tier.pointsRequired}
                        onChange={(e) => {
                          const newTiers = [...tieredRules.tiers]
                          newTiers[index].pointsRequired = parseInt(e.target.value)
                          setTieredRules({ ...tieredRules, tiers: newTiers })
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Point Multiplier"
                        value={tier.pointMultiplier}
                        onChange={(e) => {
                          const newTiers = [...tieredRules.tiers]
                          newTiers[index].pointMultiplier = parseFloat(e.target.value)
                          setTieredRules({ ...tieredRules, tiers: newTiers })
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Reward Multiplier"
                        value={tier.rewardMultiplier}
                        onChange={(e) => {
                          const newTiers = [...tieredRules.tiers]
                          newTiers[index].rewardMultiplier = parseFloat(e.target.value)
                          setTieredRules({ ...tieredRules, tiers: newTiers })
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div>
                  <Label htmlFor="tieredExpiration">Expiration (days)</Label>
                  <Input
                    id="tieredExpiration"
                    type="number"
                    value={tieredRules.expirationDays}
                    onChange={(e) => setTieredRules({ ...tieredRules, expirationDays: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Upload Program Design</h2>
        <Input type="file" onChange={handleDesignUpload} accept="image/*" className="mb-4" />
        {uploadedDesign && (
          <div className="mt-4">
            <h3 className="text-xl font-bold mb-2">Preview:</h3>
            <img src={uploadedDesign} alt="Uploaded design" className="max-w-md mx-auto" />
          </div>
        )}
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Upload Custom Punch Symbol</h2>
        <Input type="file" onChange={handlePunchUpload} accept="image/*" className="mb-4" />
        {uploadedPunch && (
          <div className="mt-4">
            <h3 className="text-xl font-bold mb-2">Preview:</h3>
            <img src={uploadedPunch} alt="Uploaded punch symbol" className="max-w-md mx-auto" />
          </div>
        )}
      </div>
      <Button className="mt-4">Create Program</Button>
    </Layout>
  )
}