"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CodeIcon as Coupon, Gift, Layers, Percent } from "lucide-react"
import Link from "next/link"

const programTypes = [
  {
    name: "Coupon Book",
    icon: Coupon,
    href: "/merchant/create-program/coupon-book", // This path is correct
    description: "Create a digital coupon book program for your customers.",
  },
  {
    name: "Punch Card",
    icon: Gift,
    href: "/merchant/create-program/punch-card",
    description: "Create a punch card program for your customers.",
  },
  {
    name: "Tiered",
    icon: Layers,
    href: "/merchant/create-program/tiered",
    description: "Create a tiered rewards program for your customers.",
  },
  {
    name: "Cashback",
    icon: Percent,
    href: "/merchant/create-program/cashback",
    description: "Create a cashback program for your customers.",
  },
]

export default function CreateProgram() {
  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {programTypes.map((type) => (
          <Card key={type.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <type.icon className="mr-2 h-6 w-6" />
                {type.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{type.description}</CardDescription>
              <Link href={type.href} passHref>
                <Button className="w-full">Select</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}