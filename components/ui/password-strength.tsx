"use client"

import { Check, X } from "lucide-react"

interface PasswordStrengthProps {
  password: string
  showChecklist?: boolean
}

interface PasswordCriteria {
  label: string
  regex: RegExp
  met: boolean
}

export default function PasswordStrength({ password, showChecklist = true }: PasswordStrengthProps) {
  const criteria: PasswordCriteria[] = [
    {
      label: "At least 8 characters",
      regex: /.{8,}/,
      met: password.length >= 8,
    },
    {
      label: "One lowercase letter",
      regex: /[a-z]/,
      met: /[a-z]/.test(password),
    },
    {
      label: "One uppercase letter", 
      regex: /[A-Z]/,
      met: /[A-Z]/.test(password),
    },
    {
      label: "One number",
      regex: /\d/,
      met: /\d/.test(password),
    },
    {
      label: "One special character (@$!%*?&)",
      regex: /[@$!%*?&]/,
      met: /[@$!%*?&]/.test(password),
    },
  ]

  const metCriteria = criteria.filter(c => c.met).length
  const strength = (metCriteria / criteria.length) * 100

  const getStrengthColor = () => {
    if (strength < 40) return "bg-red-500"
    if (strength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (strength < 40) return "Weak"
    if (strength < 80) return "Medium" 
    return "Strong"
  }

  if (!showChecklist && !password) return null

  return (
    <div className="space-y-3">
      {password && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Password Strength:</span>
            <span className={`font-medium ${
              strength < 40 ? "text-red-600" : 
              strength < 80 ? "text-yellow-600" : 
              "text-green-600"
            }`}>
              {getStrengthText()}
            </span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>
      )}

      {showChecklist && password && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">Password Requirements:</p>
          <div className="space-y-1">
            {criteria.map((criterion, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
                  criterion.met ? "text-green-600" : "text-slate-500"
                }`}
              >
                {criterion.met ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-slate-400" />
                )}
                <span className={criterion.met ? "line-through" : ""}>
                  {criterion.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
