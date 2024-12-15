'use client'

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter } from "next/navigation"
import { format, addDays } from "date-fns"
import { CalendarIcon, Plus, Minus, Upload } from 'lucide-react'
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface PunchCardProps {
  punches: number
  description: string
  reward: string
  totalPunches: number
  texture: string | null
}

function PunchCard({ punches, description, reward, totalPunches, texture }: PunchCardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [rotated, setRotated] = useState(false)
  const [textureMap, setTextureMap] = useState<THREE.Texture | null>(null)

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

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        rotated ? Math.PI : 0,
        0.1
      )
    }
  })

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => setRotated(!rotated)}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 2, 0.1]} />
        <meshStandardMaterial 
          map={textureMap} 
          color={!textureMap ? (hovered ? 'hotpink' : 'orange') : undefined}
        />
      </mesh>

      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[2.9, 1.9]} />
        <meshStandardMaterial map={textureMap} />
      </mesh>

      {Array.from({ length: totalPunches }).map((_, index) => (
        <mesh key={`punch-${index}`} position={[(index % 5 - 2) * 0.5, Math.floor(index / 5) * 0.5 - 0.5, 0.052]}>
          <circleGeometry args={[0.1, 32]} />
          <meshStandardMaterial color={index < punches ? 'red' : 'gray'} />
        </mesh>
      ))}

      <group position={[0, 0, -0.051]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <planeGeometry args={[2.9, 1.9]} />
          <meshStandardMaterial color={hovered ? 'lightblue' : 'skyblue'} />
        </mesh>

        <Text
          position={[0, 0.7, 0.001]}
          fontSize={0.1}
          maxWidth={2.5}
          textAlign="center"
          color="black"
        >
          {description}
        </Text>

        <Text
          position={[0, -0.7, 0.001]}
          fontSize={0.12}
          maxWidth={2.5}
          textAlign="center"
          color="black"
        >
          {`Reward: ${reward}`}
        </Text>
      </group>
    </group>
  )
}

const formSchema = z.object({
  startDate: z.date(),
  programType: z.string().min(1, "Program type is required"),
  region: z.string().min(1, "Region is required"),
  name: z.string().min(1, "Program name is required"),
  description: z.string(),
  rewards: z.string(),
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

const incentiveTypes = ["Rebate", "Lease", "Military"]

export default function CreateProgram() {
  const router = useRouter()
  const [nftTexture, setNftTexture] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: addDays(new Date(), 1),
      programType: "",
      region: "",
      name: "",
      description: "",
      rewards: "",
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
  })

  const { control, watch, setValue, handleSubmit } = form
  const programType = watch("programType")
  const canCombine = watch("canCombine")

  const updateProgramId = (type: string, region: string, date: Date) => {
    if (type && region && date) {
      const year = date.getFullYear().toString().slice(-2)
      return `${year}${type.replace(/\s+/g, '')}${region}`
    }
    return ""
  }

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "programType" || name === "region" || name === "startDate") {
        const newProgramId = updateProgramId(
          value.programType as string,
          value.region as string,
          value.startDate as Date
        )
        setValue("name", newProgramId)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, setValue])

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted:", data)
    router.push('/merchants')
  }

  const renderRewardsSection = () => {
    switch (programType) {
      case "Tiered":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Point System</Label>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="rewardsConfig.tiered.pointIncrement"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          min="0.1"
                          step="0.1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="rewardsConfig.tiered.pointIncrementDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Point increment description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {form.watch("rewardsConfig.tiered.tiers").map((_, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormField
                      control={control}
                      name={`rewardsConfig.tiered.tiers.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Tier name"
                              className="w-[200px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`rewardsConfig.tiered.tiers.${index}.pointThreshold`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              placeholder="Points required"
                              className="w-[200px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={control}
                    name={`rewardsConfig.tiered.tiers.${index}.benefits`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the benefits for this tier"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
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
              <FormField
                control={control}
                name="rewardsConfig.punchCard.punches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Punches Required</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        min="1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="rewardsConfig.punchCard.punchValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Punch Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        min="1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={control}
              name="rewardsConfig.punchCard.punchDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Punch Description</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., 1 punch per visit"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="rewardsConfig.punchCard.reward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Free coffee"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="w-full h-[300px]">
              <Canvas>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <OrbitControls enableZoom={false} />
                <Suspense fallback={null}>
                  <PunchCard
                    punches={form.watch("rewardsConfig.punchCard.punches") || 0}
                    description={form.watch("description") || "Collect punches to earn rewards!"}
                    reward={form.watch("rewardsConfig.punchCard.reward") || "Free item"}
                    totalPunches={form.watch("rewardsConfig.punchCard.punches") || 10}
                    texture={nftTexture}
                  />
                </Suspense>
              </Canvas>
            </div>
          </div>
        )

      case "Rebate":
      case "Lease":
      case "Military":
        return (
          <div className="space-y-6">
            <FormField
              control={control}
              name="rewardsConfig.incentives.amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incentive Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      placeholder="Enter amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={control}
                name="rewardsConfig.standard.pointValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Point Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        min="0.1"
                        step="0.1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="rewardsConfig.standard.pointDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Point Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., 1 point per dollar spent"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-4">
              <Label>Available Rewards</Label>
              {form.watch("rewardsConfig.standard.rewards").map((_, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <FormField
                    control={control}
                    name={`rewardsConfig.standard.rewards.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Reward description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const rewards = form.getValues("rewardsConfig.standard.rewards")
                      form.setValue(
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
                  const rewards = form.getValues("rewardsConfig.standard.rewards")
                  form.setValue("rewardsConfig.standard.rewards", [...rewards, ""])
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
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Program</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[280px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < addDays(new Date(), 1)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="programType"
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
                  control={control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="max-w-md" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="rewards"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rewards</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="claimLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claim Limit</FormLabel>
                    <div className="flex items-center space-x-4">
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                          min="1"
                          className="w-[100px]"
                          disabled={form.watch("isOpenEnded")}
                        />
                      </FormControl>
                      <FormField
                        control={control}
                        name="isOpenEnded"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked)
                                  if (checked) {
                                    form.setValue("claimLimit", "unlimited")
                                  } else {
                                    form.setValue("claimLimit", "1")
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="mt-0">Open-ended</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="canCombine"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Allow combination with other programs
                      </FormLabel>
                      <FormDescription>
                        This program can be combined with other loyalty programs
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={control}
                name="nftDesign"
                render={({ field }) => (
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
                              field.onChange(file)
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                setNftTexture(e.target?.result as string)
                              }
                              reader.readAsDataURL(file)
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
                            onClick={() => {
                              field.onChange(undefined)
                              setNftTexture(null)
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-2">
                        <img
                          src={typeof field.value === 'string' ? field.value : URL.createObjectURL(field.value)}
                          alt="NFT Design Preview"
                          className="max-w-xs max-h-40 object-contain"
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Rewards Configuration</Label>
                {renderRewardsSection()}
              </div>

              <Button type="submit">Create Program</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}