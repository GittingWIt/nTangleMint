'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import { getWalletData } from '@/lib/wallet-utils'

const programTypes = ["Punch Card", "Tiered", "Points", "Cashback", "Subscription"]
const categories = ["Food & Beverage", "Retail", "Health & Fitness", "Multi-merchant"]

const formSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  type: z.enum(programTypes as [string, ...string[]]),
  category: z.enum(categories as [string, ...string[]]),
  description: z.string().min(1, "Description is required"),
  rewardStructure: z.string().optional(),
  isOpenEnded: z.boolean(),
  nftDesign: z.instanceof(File).optional(),
})

type FormValues = z.infer<typeof formSchema>

const saveProgramData = (program: any) => {
  const timestamp = new Date().toISOString()
  const walletData = getWalletData()
  const merchantId = walletData?.publicAddress || 'default'
  
  // Get existing programs
  const existingPrograms = JSON.parse(localStorage.getItem('programs') || '{}')
  const globalPrograms = JSON.parse(localStorage.getItem('globalPrograms') || '[]')
  
  // Initialize merchant's programs if they don't exist
  if (!existingPrograms[merchantId]) {
    existingPrograms[merchantId] = []
  }
  
  // Create new program with proper date and structure
  const newProgram = {
    ...program,
    id: `${merchantId}-${Date.now()}`,
    business: walletData?.businessName || 'Unknown Business',
    participants: [],
    rewards_claimed: 0,
    created_at: timestamp,
    image: "/placeholder.svg?height=100&width=100",
    merchantId
  }
  
  // Add to merchant-specific programs
  existingPrograms[merchantId].push(newProgram)
  localStorage.setItem('programs', JSON.stringify(existingPrograms))
  
  // Add to global programs list
  const globalProgram = {
    ...newProgram,
    participants: 0, // Convert array to number for global listing
    type: program.type.toLowerCase().replace(' ', '-') as 'punch-card' | 'tiered' | 'points' | 'coalition'
  }
  globalPrograms.push(globalProgram)
  localStorage.setItem('globalPrograms', JSON.stringify(globalPrograms))
  
  return newProgram
}

export default function CreateProgram() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [nftPreview, setNftPreview] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "Punch Card",
      category: "Retail",
      description: "",
      rewardStructure: "",
      isOpenEnded: false,
      nftDesign: undefined,
    }
  })

  const onSubmit = (data: FormValues) => {
    const program = saveProgramData({
      name: data.name,
      type: data.type,
      category: data.category,
      description: data.description,
      rewardStructure: data.rewardStructure,
      isOpenEnded: data.isOpenEnded,
    })
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('programCreated', { detail: program }))
    
    // Redirect to merchant dashboard
    router.push('/merchant')
  }

  const nextStep = () => {
    setStep(step + 1)
  }

  const prevStep = () => setStep(step - 1)

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Program</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={step.toString()} onValueChange={(value) => setStep(parseInt(value))}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="1">Basic Info</TabsTrigger>
                  <TabsTrigger value="2">Rewards</TabsTrigger>
                  <TabsTrigger value="3">NFT Design</TabsTrigger>
                </TabsList>
                <TabsContent value="1">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select program type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {programTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="rewardStructure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward Structure</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe how customers earn and redeem rewards" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isOpenEnded"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Open-ended Program</FormLabel>
                            <FormDescription>
                              Allow customers to continue earning rewards indefinitely
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="3">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nftDesign"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>NFT Design</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    onChange(file)
                                    const reader = new FileReader()
                                    reader.onload = (e) => {
                                      setNftPreview(e.target?.result as string)
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                                className="hidden"
                                id="nftDesign"
                                {...field}
                              />
                              <Label htmlFor="nftDesign" className="cursor-pointer">
                                <div className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
                                  <Upload className="w-4 h-4" />
                                  <span>Upload NFT Design</span>
                                </div>
                              </Label>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {nftPreview && (
                      <div className="mt-4">
                        <img src={nftPreview} alt="NFT Preview" className="max-w-xs max-h-40 object-contain" />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={nextStep} className="ml-auto">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="ml-auto">
              Create Program
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}