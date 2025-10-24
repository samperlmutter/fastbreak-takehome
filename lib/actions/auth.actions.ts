'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAction } from './action-wrapper'
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
export async function signUpAction(
  input: SignUpInput
): Promise<ActionResponse<void>> {
  // Validate input
  const validation = signUpSchema.safeParse(input)

  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  const { email, password } = validation.data

  try {
    const supabase = await createClient()

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Failed to create user account',
      }
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return {
        success: true,
        data: undefined,
        message: 'Please check your email to confirm your account',
      }
    }

    revalidatePath('/', 'layout')
    return {
      success: true,
      data: undefined,
      message: 'Account created successfully',
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Log in an existing user with email and password
 */
export async function loginAction(
  input: LoginInput
): Promise<ActionResponse<void>> {
  // Validate input
  const validation = loginSchema.safeParse(input)

  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  const { email, password } = validation.data

  try {
    const supabase = await createClient()

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    if (!data.session) {
      return {
        success: false,
        error: 'Failed to create session',
      }
    }

    revalidatePath('/', 'layout')
    return {
      success: true,
      data: undefined,
      message: 'Logged in successfully',
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Log out the current user
 */
export async function logoutAction(): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/', 'layout')
    return {
      success: true,
      data: undefined,
      message: 'Logged out successfully',
    }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogleAction(): Promise<ActionResponse<{ url: string }>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data.url) {
      return {
        success: false,
        error: 'Failed to get OAuth URL',
      }
    }

    return {
      success: true,
      data: { url: data.url },
    }
  } catch (error) {
    console.error('Google sign-in error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
