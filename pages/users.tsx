import { useState } from 'react'
import Layout from '../components/Layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock data for popular programs
const popularPrograms = {
  punchCard: [
    { id: 1,   name: "Joe's Coffee Loyalty", merchant: "Joe's Coffee", popularity: 95 },
    { id: 2, name: "BookWorm Rewards", merchant: "City Bookstore", popularity: 88 },
    { id: 3, name: "Pizza Paradise Points", merchant: "Pizza Paradise", popularity: 82 },
  ],
  coalition: [
    { id: 4, name: "Downtown Delights", merchant: "Multiple Merchants", popularity: 91 },
    { id: 5, name: "Shop & Save Alliance", merchant: "Retail Coalition", popularity: 87 },
    { id: 6, name: "Foodie Favorites", merchant: "Restaurant Group", popularity: 79 },
  ],
  tiered: [
    { id: 7, name: "Luxury Levels", merchant: "Glamour Department Store", popularity: 93 },
    { id: 8, name: "Fitness Fanatic Tiers", merchant: "City Gym", popularity: 85 },
    { id: 9, name: "Travel Tiers", merchant: "Wanderlust Airlines", popularity: 81 },
  ],
}

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <Layout>
      <h1 className="text-4xl font-bold text-center mb-8">Customer Relationships Made Easy</h1>
      <div className="max-w-md mx-auto mb-8">
        <Input
          type="text"
          placeholder="Search by merchant, program type, or details"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <Button className="w-full">Search</Button>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Popular Programs</h2>
        <Tabs defaultValue="punchCard">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="punchCard">Punch Card</TabsTrigger>
            <TabsTrigger value="coalition">Coalition</TabsTrigger>
            <TabsTrigger value="tiered">Tiered</TabsTrigger>
          </TabsList>
          {Object.entries(popularPrograms).map(([programType, programs]) => (
            <TabsContent key={programType} value={programType}>
              {programs.map((program) => (
                <Card key={program.id} className="mb-4">
                  <CardHeader>
                    <CardTitle>{program.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Merchant: {program.merchant}</p>
                    <p>Popularity: {program.popularity}%</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  )
}