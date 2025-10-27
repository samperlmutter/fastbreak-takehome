import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database, Profile } from './types'
import type { User } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for use in Server Components
 * This client automatically manages cookies for authentication
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Gets the current authenticated user from the server
 * Returns null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error in getUser:', error)
    return null
  }
}

/**
 * Gets the current session from the server
 * Returns null if no active session
 */
export async function getSession() {
  const supabase = await createClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error fetching session:', error)
      return null
    }

    return session
  } catch (error) {
    console.error('Error in getSession:', error)
    return null
  }
}

/**
 * Gets the current user and their profile information
 * Returns user with profile data, or null if not authenticated
 */
export async function getUserProfile(): Promise<{
  user: User
  profile: Profile | null
} | null> {
  const supabase = await createClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Fetch user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      user,
      profile: profile || null,
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}
