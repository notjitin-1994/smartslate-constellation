/**
 * Email validation using a comprehensive regex pattern
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Password strength validation
 */
export interface PasswordStrength {
  score: number // 0-5
  feedback: string[]
  isValid: boolean
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  if (password.length === 0) {
    return { score: 0, feedback: ['Password is required'], isValid: false }
  }

  // Length check
  if (password.length >= 8) score++
  else feedback.push('At least 8 characters required')

  if (password.length >= 12) score++

  // Complexity checks
  if (/[a-z]/.test(password)) score++
  else feedback.push('Include lowercase letters')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Include uppercase letters')

  if (/\d/.test(password)) score++
  else feedback.push('Include numbers')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else feedback.push('Include special characters')

  return {
    score: Math.min(score, 5),
    feedback,
    isValid: score >= 3 && password.length >= 8
  }
}

/**
 * URL validation
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    // Also accept URLs without protocol
    try {
      new URL(`https://${url}`)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Username validation
 */
export function isValidUsername(username: string): boolean {
  // Username must be 3-30 characters, alphanumeric with underscores and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
  return usernameRegex.test(username)
}

/**
 * Phone number validation (basic international format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  // Check if it's between 10 and 15 digits (international range)
  return digitsOnly.length >= 10 && digitsOnly.length <= 15
}

/**
 * Form field validation helper
 */
export interface ValidationRule<T = any> {
  validate: (value: T) => boolean
  message: string
}

export function validateField<T>(
  value: T,
  rules: ValidationRule<T>[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Common validation rules factory
 */
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule<any> => ({
    validate: (value) => value !== null && value !== undefined && value !== '',
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: message || `Must be at most ${max} characters`
  }),

  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: isValidEmail,
    message
  }),

  url: (message = 'Invalid URL'): ValidationRule<string> => ({
    validate: isValidUrl,
    message
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => regex.test(value),
    message
  })
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
