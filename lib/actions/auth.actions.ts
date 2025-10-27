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
export const signUpAction = createAction({
  schema: signUpSchema,
  requireAuth: false,
  successMessage: 'Account created successfully',
  handler: async (input: SignUpInput) => {
    const supabase = await createClient()

    const { email, password } = input

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
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
        data: undefined,
        message: 'Please check your email to confirm your account',
      }
    }

    return undefined
  },
})

/**
 * Log in an existing user with email and password
 */
export const loginAction = createAction({
  schema: loginSchema,
  requireAuth: false,
  successMessage: 'Logged in successfully',
  handler: async (input: LoginInput) => {
    const supabase = await createClient()

    const { email, password } = input

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
    return undefined
  },
})

/**
 * Log out the current user
 */
export const logoutAction = createAction({
  requireAuth: false,
  successMessage: 'Logged out successfully',
  handler: async () => {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/', 'layout')
    return undefined
  },
})

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogleAction = createAction({
  requireAuth: false,
  handler: async () => {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.url) {
      throw new Error('Failed to get OAuth URL')
    }

    return { url: data.url }
  },
})
