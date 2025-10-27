'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { ActionResponse } from './types'

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Type definitions
type SignUpInput = z.infer<typeof signUpSchema>
type LoginInput = z.infer<typeof loginSchema>

/**
 * Sign up a new user with email and password
 */
export async function signUpAction(input: SignUpInput): Promise<ActionResponse> {
  // Validate input
  const validation = signUpSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    const supabase = await createClient()

    const { email, password } = validation.data

    // Get the origin dynamically from request headers
    const headersList = await headers()
    const origin = headersList.get('origin') || headersList.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.user) {
      throw new Error('Failed to create user account')
    }

    revalidatePath('/', 'layout')

    // Check if email confirmation is required
    if (data.user && !data.session) {
      // Return custom message for email confirmation scenario
      // This also handles duplicate email (Supabase security feature)
      return {
        success: true,
        data: undefined,
        message: 'Please check your email to confirm your account',
      }
    }

    return {
      success: true,
      data: undefined,
      message: 'Account created successfully',
    }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Log in an existing user with email and password
 */
export async function loginAction(input: LoginInput): Promise<ActionResponse> {
  // Validate input
  const validation = loginSchema.safeParse(input)
  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  try {
    const supabase = await createClient()

    const { email, password } = validation.data

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error('Invalid email or password')
    }

    if (!data.session) {
      throw new Error('Failed to create session')
    }

    revalidatePath('/', 'layout')

    return {
      success: true,
      data: undefined,
      message: 'Logged in successfully',
    }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Log out the current user
 */
export async function logoutAction(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/', 'layout')

    return {
      success: true,
      data: undefined,
      message: 'Logged out successfully',
    }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogleAction(): Promise<ActionResponse<{ url: string }>> {
  try {
    const supabase = await createClient()

    // Get the origin dynamically from request headers
    const headersList = await headers()
    const origin = headersList.get('origin') || headersList.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.url) {
      throw new Error('Failed to get OAuth URL')
    }

    return {
      success: true,
      data: { url: data.url },
    }
  } catch (error) {
    console.error('Server action error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
