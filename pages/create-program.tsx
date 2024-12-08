'use client'

<<<<<<< HEAD
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { format, addDays } from "date-fns"
import { CalendarIcon, Plus, Minus, Upload } from 'lucide-react'
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
=======
import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, addDays } from "date-fns"
import { CalendarIcon } from 'lucide-react'
>>>>>>> 5445f674305b9b6d5a55fa563884ddee67f6b9bf
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
<<<<<<< HEAD
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Suspense } from 'react'


function PunchCard({ punches, description, reward, totalPunches, texture }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [rotated, setRotated] = useState(false)
  
  // Create a state for the loaded texture
  const [textureMap, setTextureMap] = useState(null)

  // Load texture when texture prop changes
  useEffect(() => {
    if (texture) {
      const loader = new THREE.TextureLoader()
      loader.crossOrigin = 'anonymous'
      loader.load(texture, (loadedTexture) => {
        setTextureMap(loadedTexture)
      })
    } else {
      setTextureMap(null)
    }
  }, [texture])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        rotated ? Math.PI : 0,
        0.1
      )
    }
  })

  const handleClick = () => {
    setRotated(!rotated)
  }

  return (
    <group
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Card body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 2, 0.1]} /> {/* Increased thickness */}
        <meshStandardMaterial 
          map={textureMap} 
          color={!textureMap ? (hovered ? 'hotpink' : 'orange') : undefined} 
        />
      </mesh>

      {/* Front side */}
      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[2.9, 1.9]} /> {/* Slightly smaller to create a border effect */}
        <meshStandardMaterial map={textureMap} />
      </mesh>

      {/* Punches on front side */}
      {Array.from({ length: totalPunches }).map((_, index) => (
        <mesh key={`front-${index}`} position={[(index % 5 - 2) * 0.5, Math.floor(index / 5) * 0.5 - 0.5, 0.052]}>
          <circleGeometry args={[0.1, 32]} />
          <meshStandardMaterial color={index < punches ? 'red' : 'gray'} />
        </mesh>
      ))}

      {/* Back side */}
      <mesh position={[0, 0, -0.051]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.9, 1.9]} />
        <meshStandardMaterial color={hovered ? 'lightblue' : 'skyblue'} />
      </mesh>

      {/* Punches on back side */}
      {Array.from({ length: totalPunches }).map((_, index) => (
        <mesh key={`back-${index}`} position={[(index % 5 - 2) * 0.5, Math.floor(index / 5) * 0.5 - 0.5, -0.052]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.1, 32]} />
          <meshStandardMaterial color={index < punches ? 'red' : 'gray'} />
        </mesh>
      ))}

      {/* Description on back side */}
      <Text
        position={[0, 0.7, -0.052]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.1}
        maxWidth={2.5}
        textAlign="center"
        color="black"
      >
        {description}
      </Text>

      {/* Reward on back side */}
      <Text
        position={[0, -0.7, -0.052]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.12}
        maxWidth={2.5}
        textAlign="center"
        color="black"
      >
        Reward: {reward}
      </Text>
    </group>
  )
}

// Updated mock data for existing programs
const existingPrograms = {
  Rebate: [
    { id: "24RebateNorth", name: "Spring Rebate Program" },
    { id: "24RebateEast", name: "Summer Savings Rebate" },
  ],
  Lease: [
    { id: "24LeaseEast", name: "Annual Lease Incentive" },
    { id: "24LeaseWest", name: "New Customer Lease Program" },
  ],
  Military: [
    { id: "24MilitaryNorth", name: "Active Duty Discount" },
    { id: "24MilitarySouth", name: "Veterans Appreciation Program" },
  ],
  Standard: [
    { id: "24PunchCardNorth", name: "Morning Coffee Club" },
    { id: "24RewardsEast", name: "Lunch Special" },
  ]
}

const programTypes = [
  "Punch Card",
  "Coalition",
  "Tiered",
  "Local Partnership",
  "Incentives",
  "Rewards",
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

const incentiveTypes = ["Rebate", "Lease", "Military"]

// Updated form validation schema
const formSchema = z.object({
  startDate: z.date(),
  programType: z.string().min(1, "Program type is required"),
  programId: z.string(),
  description: z.string().min(1, "Description is required"),
  claimLimit: z.string(),
  isOpenEnded: z.boolean(),
  canCombine: z.boolean(),
  compatiblePrograms: z.array(z.string()),
  nftDesign: z.instanceof(File).optional().or(z.string()),
  rewardsConfig: z.object({
    tiered: z.object({
      tiers: z.array(z.object({
        name: z.string(),
        pointThreshold: z.number(),
        benefits: z.string()
      })),
      pointIncrement: z.number(),
      pointIncrementDescription: z.string()
    }),
    punchCard: z.object({
      punches: z.number(),
      reward: z.string(),
      punchValue: z.number(),
      punchDescription: z.string(),
      customPunchDesign: z.instanceof(File).optional().or(z.string())
    }),
    standard: z.object({
      pointValue: z.number(),
      pointDescription: z.string(),
      rewards: z.array(z.string())
    }),
    incentives: z.object({
      subType: z.enum(["Rebate", "Lease", "Military"]),
      amount: z.number().min(0, "Amount must be a positive number")
    })
  })
})

type FormValues = z.infer<typeof formSchema>

export default function CreateProgram() {
  const router = useRouter()
  const [selectedProgramType, setSelectedProgramType] = useState("")
  const [useCustomPunch, setUseCustomPunch] = useState(false);
  const [nftTexture, setNftTexture] = useState(null);

  const defaultValues: FormValues = {
    startDate: addDays(new Date(), 1),
    programType: "",
    programId: "",
    description: "",
    claimLimit: "1",
    isOpenEnded: false,
    canCombine: false,
    compatiblePrograms: [],
    nftDesign: undefined,
    rewardsConfig: {
      tiered: {
        tiers: [
          { name: "Bronze", pointThreshold: 100, benefits: "" },
          { name: "Silver", pointThreshold: 500, benefits: "" },
          { name: "Gold", pointThreshold: 1000, benefits: "" }
        ],
        pointIncrement: 1,
        pointIncrementDescription: "1 point per dollar spent"
      },
      punchCard: {
        punches: 10,
        reward: "Free item",
        punchValue: 1,
        punchDescription: "1 punch per visit",
        customPunchDesign: undefined
      },
      standard: {
        pointValue: 1,
        pointDescription: "1 point per dollar spent",
        rewards: []
      },
      incentives: {
        subType: "Rebate",
        amount: 0
      }
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  })

  const { control, watch, setValue, handleSubmit } = form
  const programType = watch("programType")
  const canCombine = watch("canCombine")

  const updateProgramId = (type: string, date: Date) => {
    if (type && date) {
      const year = date.getFullYear().toString().slice(-2)
      return `${year}${type.replace(/\s+/g, '')}`
=======

export default function CreateProgram() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    startDate: addDays(new Date(), 1),
    programType: "",
    region: "",
    programId: "",
    name: "",
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
>>>>>>> 5445f674305b9b6d5a55fa563884ddee67f6b9bf
    }
    return ""
  }

<<<<<<< HEAD
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "programType" || name === "startDate") {
        const newProgramId = updateProgramId(value.programType as string, value.startDate as Date)
        setValue("programId", newProgramId)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, setValue])

  const onSubmit = async (data: FormValues) => {
    console.log("Form submitted:", data)
    try {
      // Here you would typically make an API call to save the program
      // await createProgram(data)
      router.push('/merchants')
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  const renderRewardsSection = () => {
    switch (programType) {
      case "Tiered":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Point System</Label>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="rewardsConfig.tiered.pointIncrement"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      min="0.1"
                      step="0.1"
                    />
                  )}
                />
                <Controller
                  name="rewardsConfig.tiered.pointIncrementDescription"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Point increment description"
                    />
                  )}
                />
              </div>
            </div>

            {defaultValues.rewardsConfig.tiered.tiers.map((_, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Controller
                      name={`rewardsConfig.tiered.tiers.${index}.name`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Tier name"
                          className="w-[200px]"
                        />
                      )}
                    />
                    <Controller
                      name={`rewardsConfig.tiered.tiers.${index}.pointThreshold`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                          placeholder="Points required"
                          className="w-[200px]"
                        />
                      )}
                    />
                  </div>
                  <Controller
                    name={`rewardsConfig.tiered.tiers.${index}.benefits`}
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="Describe the benefits for this tier"
                      />
                    )}
                  />
                </div>
              </Card>
            ))}
          </div>
        )

      case "Punch Card":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Punches Required</Label>
                <Controller
                  name="rewardsConfig.punchCard.punches"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      min="1"
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Punch Value</Label>
                <Controller
                  name="rewardsConfig.punchCard.punchValue"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      min="1"
                    />
                  )}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Punch Description</Label>
              <Controller
                name="rewardsConfig.punchCard.punchDescription"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g., 1 punch per visit"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={useCustomPunch}
                  onCheckedChange={setUseCustomPunch}
                  id="custom-punch-toggle"
                />
                <Label htmlFor="custom-punch-toggle">Use Custom Punch Design</Label>
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-full h-[300px]">
                <Canvas>
                  <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                  <OrbitControls enableZoom={false} />
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} />
                  <Suspense fallback={null}>
                    <PunchCard
                      punches={0}
                      description={watch("description") || "Collect punches to earn rewards!"}
                      reward={watch("rewardsConfig.punchCard.reward") || "Free item"}
                      totalPunches={watch("rewardsConfig.punchCard.punches") || 10}
                      texture={nftTexture}
                    />
                  </Suspense>
                </Canvas>
              </div>
            </div>
          </div>
        )

      case "Incentives":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Incentive Type</Label>
              <Controller
                name="rewardsConfig.incentives.subType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select incentive type" />
                    </SelectTrigger>
                    <SelectContent>
                      {incentiveTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Incentive Amount ($)</Label>
              <Controller
                name="rewardsConfig.incentives.amount"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                  />
                )}
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Point Value</Label>
                <Controller
                  name="rewardsConfig.standard.pointValue"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                      min="0.1"
                      step="0.1"
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Point Description</Label>
                <Controller
                  name="rewardsConfig.standard.pointDescription"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., 1 point per dollar spent"
                    />
                  )}
                />
              </div>
            </div>
            <div className="space-y-4">
              <Label>Available Rewards</Label>
              {watch("rewardsConfig.standard.rewards").map((_, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Controller
                    name={`rewardsConfig.standard.rewards.${index}`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Reward description"
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const rewards = watch("rewardsConfig.standard.rewards")
                      setValue(
                        "rewardsConfig.standard.rewards",
                        rewards.filter((_, i) => i !== index)
                      )
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const rewards = watch("rewardsConfig.standard.rewards")
                  setValue("rewardsConfig.standard.rewards", [...rewards, ""])
                }}
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Reward
              </Button>
            </div>
          </div>
        )
    }
=======
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
>>>>>>> 5445f674305b9b6d5a55fa563884ddee67f6b9bf
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Program</CardTitle>
        </CardHeader>
        <CardContent>
<<<<<<< HEAD
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[280px] justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < addDays(new Date(), 1)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program-type">Program Type</Label>
              <Controller
                name="programType"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedProgramType(value)
                    }}
                    value={field.value}
                  >
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
                )}
              />
=======
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
>>>>>>> 5445f674305b9b6d5a55fa563884ddee67f6b9bf
            </div>

            <div className="space-y-2">
              <Label htmlFor="program-id">Program ID</Label>
<<<<<<< HEAD
              <Controller
                name="programId"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    readOnly
                    className="max-w-md bg-muted"
                  />
                )}
=======
              <Input
                id="program-id"
                value={formData.programId}
                readOnly
                className="max-w-md bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Program Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="max-w-md"
>>>>>>> 5445f674305b9b6d5a55fa563884ddee67f6b9bf
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
<<<<<<< HEAD
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="min-h-[60px]"
                  />
                )}
=======
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="min-h-[100px]"
>>>>>>> 5445f674305b9b6d5a55fa563884ddee67f6b9bf
              />
            </div>

            <div className="space-y-2">
<<<<<<< HEAD
              <Label>NFT Design</Label>
              <Controller
                name="nftDesign"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            field.onChange(file);
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setNftTexture(e.target.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="nftDesign"
                      />
                      <Label htmlFor="nftDesign" className="cursor-pointer">
                        <div className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
                          <Upload className="w-4 h-4" />
                          <span>Upload NFT Design</span>
                        </div>
                      </Label>
                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(null)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {field.value && (
                      <div className="mt-2">
                        <img
                          src={typeof field.value === 'string' ? field.value : URL.createObjectURL(field.value)}
                          alt="NFT Design Preview"
                          className="max-w-xs max-h-40 object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
=======
              <Label htmlFor="rewards">Rewards</Label>
              <Textarea
                id="rewards"
                name="rewards"
                value={formData.rewards}
                onChange={handleInputChange}
                className="min-h-[100px]"
>>>>>>> 5445f674305b9b6d5a55fa563884ddee67f6b9bf
              />
            </div>

            <div className="space-y-2">
<<<<<<< HEAD
              <Label>Rewards Configuration</Label>
              {renderRewardsSection()}
            </div>

            <div className="space-y-2">
              <Label>Claim Limit</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="claimLimit"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(e.target.value)}
                        min="1"
                        className="w-[100px]"
                        disabled={watch("isOpenEnded")}
                      />
                    )}
=======
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
>>>>>>> 5445f674305b9b6d5a55fa563884ddee67f6b9bf
                  />
                  <Label>times</Label>
                </div>
                <div className="flex items-center space-x-2">
<<<<<<< HEAD
                  <Controller
                    name="isOpenEnded"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (checked) {
                            setValue("claimLimit", "unlimited")
                          } else {
                            setValue("claimLimit", "1
=======
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
>>>>>>> 5445f674305b9b6d5a55fa563884ddee67f6b9bf
