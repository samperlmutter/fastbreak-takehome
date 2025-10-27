import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

/**
 * Auth callback route handler
 * Handles OAuth redirects and email confirmation links
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
    }

    // Check if user has a profile, create one if not
    if (data.user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        let firstName: string | null = null
        let lastName = ''

        // First, check if we have first_name/last_name from email signup
        if (data.user.user_metadata?.first_name && data.user.user_metadata?.last_name) {
          firstName = data.user.user_metadata.first_name as string
          lastName = data.user.user_metadata.last_name as string
        }
        // Otherwise, try to extract from OAuth metadata (Google provides full_name)
        else if (data.user.user_metadata?.full_name) {
          const fullName = data.user.user_metadata.full_name as string
          const nameParts = fullName.trim().split(/\s+/)
          if (nameParts.length > 0 && nameParts[0]) {
            firstName = nameParts[0]
            lastName = nameParts.slice(1).join(' ') || ''
          }
        } else if (data.user.user_metadata?.name) {
          const fullName = data.user.user_metadata.name as string
          const nameParts = fullName.trim().split(/\s+/)
          if (nameParts.length > 0 && nameParts[0]) {
            firstName = nameParts[0]
            lastName = nameParts.slice(1).join(' ') || ''
          }
        }

        // Only create profile if we have a real first name
        if (firstName) {
          const profileData: Database['public']['Tables']['profiles']['Insert'] = {
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
          }

          // TypeScript has trouble inferring the type after the select query above
          // Using type assertion to help the compiler
          const { error: profileError } = await (supabase
            .from('profiles') as any)
            .insert(profileData)

          if (profileError) {
            console.error('Profile creation error:', profileError)
          }
        }
        // If no name available, skip profile creation - user will see email on dashboard
      }
    }
  }

  // Redirect to dashboard on success
  return NextResponse.redirect(`${origin}/dashboard`)
}
