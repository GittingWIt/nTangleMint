'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, addDays } from "date-fns"
import { CalendarIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function CreateProgram() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    startDate: addDays(new Date(), 1),
    programType: "",
    region: "",
    programId: "",
    description: "",
    rewards: "",
    claimLimit: "1",
    isOpenEnded: false,
    canCombine: false,
    compatiblePrograms: [] as string[]
  })

  const programTypes = [
    "Punch Card",
    "Coalition",
    "Tiered",
    "Local Partnership",
    "Military",
    "Rebate",
    "Rewards",
    "Lease"
  ].sort()

  const regions = [
    "North",
    "South",
    "East",
    "West",
    "Northeast",
    "Northwest",
    "Southeast",
    "Southwest"
  ].sort()

  const updateProgramId = (type: string, region: string) => {
    if (type && region && formData.startDate) {
      const year = formData.startDate.getFullYear().toString().slice(-2)
      return `${year}${type.replace(/\s+/g, '')}${region}`
    }
    return ""
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'programType' || name === 'region' 
        ? { programId: updateProgramId(name === 'programType' ? value : prev.programType, name === 'region' ? value : prev.region) }
        : {})
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      programId: updateProgramId(name === 'programType' ? value : prev.programType, name === 'region' ? value : prev.region)
    }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        startDate: date,
        programId: updateProgramId(prev.programType, prev.region)
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    console.log("Form submitted:", formData)
    router.push('/merchants')
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Program</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Start Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < addDays(new Date(), 1)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="program-type">Program Type</Label>
                <Select onValueChange={(value) => handleSelectChange('programType', value)}>
                  <SelectTrigger id="program-type">
                    <SelectValue placeholder="Select program type" />
                  </SelectTrigger>
                  <SelectContent>
                    {programTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select onValueChange={(value) => handleSelectChange('region', value)}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program-id">Program ID</Label>
              <Input
                id="program-id"
                value={formData.programId}
                readOnly
                className="max-w-md bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rewards">Rewards</Label>
              <Textarea
                id="rewards"
                name="rewards"
                value={formData.rewards}
                onChange={handleInputChange}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Claim Limit</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    name="claimLimit"
                    value={formData.isOpenEnded ? "" : formData.claimLimit}
                    onChange={handleInputChange}
                    min="1"
                    className="w-[100px]"
                    disabled={formData.isOpenEnded}
                  />
                  <Label>times</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isOpenEnded}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        isOpenEnded: checked,
                        claimLimit: checked ? "unlimited" : "1"
                      }))
                    }}
                  />
                  <Label>Open-ended</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="can-combine"
                checked={formData.canCombine}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    canCombine: checked
                  }))
                }}
              />
              <Label htmlFor="can-combine">Allow combination with other programs</Label>
            </div>

            <Button type="submit">Create Program</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}