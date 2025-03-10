"use client"

import { useState, useEffect } from "react"

interface ValidationRules {
  [key: string]: (value: any) => boolean
}

interface FormState {
  [key: string]: any
}

export function useFormValidation(initialState: FormState, validationRules: ValidationRules) {
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isValid, setIsValid] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Validate the form whenever values change
  useEffect(() => {
    if (!isDirty) return

    const newErrors: { [key: string]: string } = {}
    let formIsValid = true

    // Check each field against its validation rule
    for (const field of Object.keys(validationRules)) {
      // Make sure both the field and validation rule exist
      const validationRule = validationRules[field]

      if (typeof validationRule === "function" && field in values) {
        const isValidField = validationRule(values[field])
        if (!isValidField) {
          newErrors[field] = `${field} is invalid`
          formIsValid = false
        }
      } else {
        // Either field doesn't exist in values or validation rule is not a function
        newErrors[field] = `${field} is missing or has no validation rule`
        formIsValid = false
      }
    }

    setErrors(newErrors)
    setIsValid(formIsValid)
  }, [values, validationRules, isDirty])

  // Update a single field
  const handleChange = (field: string, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (!isDirty) setIsDirty(true)
  }

  // Set multiple fields at once
  const setFields = (newValues: Partial<FormState>) => {
    setValues((prev) => ({ ...prev, ...newValues }))
    if (!isDirty) setIsDirty(true)
  }

  // Reset the form
  const reset = () => {
    setValues(initialState)
    setErrors({})
    setIsValid(false)
    setIsDirty(false)
  }

  return {
    values,
    errors,
    isValid,
    isDirty,
    handleChange,
    setFields,
    reset,
  }
}