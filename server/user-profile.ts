'use server'

import { createClient } from './auth'
import type { User } from '@supabase/supabase-js'

export type UserProfileData = {
  supabaseUser: User | null
}

/**
 * Get user profile data including Supabase user.
 * This is a regular server action without caching - meant to be used
 * with Suspense boundaries for loading states.
 *
 * Next.js will automatically handle request memoization during a single render.
 */
export async function getUserProfileAction(): Promise<UserProfileData> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      supabaseUser: null
    }
  }

  return {
    supabaseUser: user
  }
}
