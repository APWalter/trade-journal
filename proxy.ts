import { type NextRequest, NextResponse } from "next/server"
import { createI18nMiddleware } from "next-international/middleware"
import { createServerClient } from "@supabase/ssr"
import { geolocation } from "@vercel/functions"
import { User } from "@supabase/supabase-js"

// Maintenance mode flag
const MAINTENANCE_MODE = false

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "fr", "de", "es", "it", "pt", "vi", "hi", "ja", "zh", "yo"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
})

async function updateSession(request: NextRequest) {
  // Create a proper NextResponse first
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              httpOnly: false,
            })
          })
        },
      },
    },
  )

  let user: User | null = null
  let error: unknown = null

  try {
    // Add timeout to prevent hanging requests
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 5000))

    const result = (await Promise.race([authPromise, timeoutPromise])) as any
    user = result.data?.user || null
    error = result.error
  } catch (authError: any) {
    console.warn("Auth check failed (Bypassed):", authError)
    user = null
    error = authError
  }

  return { response, user, error }
}

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Static asset exclusions
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname.includes("/videos/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes("/opengraph-image")
  ) {
    return NextResponse.next()
  }

  // 1. Apply i18n middleware first
  const response = I18nMiddleware(req)

  // 2. Update session (but we won't block on it)
  const { response: authResponse, user, error } = await updateSession(req)

  // Merge headers/cookies
  authResponse.headers.forEach((value, key) => {
    response.headers.set(key, value)
  })
  authResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, { ...cookie })
  })

  // 3. Redirect unauthenticated users to /authentication (unless dev mode is enabled)
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true"
  if (!user && !isDevMode) {
    const locale = req.nextUrl.pathname.split("/")[1] || "en"
    return NextResponse.redirect(new URL(`/${locale}/authentication`, req.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|mp4|webm|gif|html|webp)$).*)",
  ],
}