"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
  programName: z.string().min(2, {
    message: "Program name must be at least 2 characters.",
  }),
  programType: z.string().min(2, {
    message: "Please select a program type.",
  }),
  numberOfPunches: z.preprocess(
    (str) => Number.parseInt(str as string, 10),
    z.number().min(1, {
      message: "Number of punches must be at least 1.",
    }),
  ),
})

export function PunchCardClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      programName: "",
      programType: "",
      numberOfPunches: 5,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setMessage(null)

    console.log("Form values:", values)

    try {
      // Simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setMessage({
        type: "success",
        text: "Program created successfully!",
      })

      // Reset form after successful submission
      form.reset()
    } catch (error: any) {
      console.error("Error creating program:", error)
      setMessage({
        type: "error",
        text: error.message || "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Punch Card Program</CardTitle>
        <CardDescription>Create a new punch card program for your customers.</CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <div
            className={`mb-4 p-3 rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="programName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Program" {...field} />
                  </FormControl>
                  <FormDescription>This is the name of your punch card program.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="programType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="punch_card">Punch Card</SelectItem>
                      <SelectItem value="loyalty_points">Loyalty Points</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>This is the type of program you want to create.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numberOfPunches"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Punches</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5" {...field} />
                  </FormControl>
                  <FormDescription>This is the number of punches required to complete the program.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Program"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}