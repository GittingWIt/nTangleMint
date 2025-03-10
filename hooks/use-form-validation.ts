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
    Object.keys(validationRules).forEach((field) => {
      const isValidField = validationRules[field](values[field])
      if (!isValidField) {
        newErrors[field] = `${field} is invalid`
        formIsValid = false
      }
    })

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