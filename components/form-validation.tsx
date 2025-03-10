"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface FormValidationProps {
  formState: {
    isValid: boolean
    [key: string]: any
  }
  requiredFields: string[]
  fieldLabels?: { [key: string]: string }
}

export function FormValidation({ formState, requiredFields, fieldLabels = {} }: FormValidationProps) {
  const [missingFields, setMissingFields] = useState<string[]>([])

  useEffect(() => {
    const missing = requiredFields.filter((field) => !formState[field])
    setMissingFields(missing)
  }, [formState, requiredFields])

  if (formState.isValid) {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
        <AlertDescription className="text-green-700">
          All required fields are filled. You can now create the program.
        </AlertDescription>
      </Alert>
    )
  }

  if (missingFields.length > 0) {
    return (
      <Alert variant="default" className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
        <AlertDescription className="text-amber-700">
          Please fill in the following required fields:
          <ul className="list-disc pl-5 mt-1">
            {missingFields.map((field) => (
              <li key={field}>{fieldLabels[field] || field}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}