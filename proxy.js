import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    // Only ORGANIZER and SUPER_ADMIN can access admin
    if (userRole !== 'ORGANIZER' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Redirect logged-in users away from login/register
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    if (userRole === 'PLAYER') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // --- BEGIN: File serving logic from middleware.js ---
  // Only rewrite /events/* if it looks like a file (has extension)
  function isFilePath(pathname) {
    const lastSegment = pathname.split('/').pop()
    return lastSegment && lastSegment.includes('.') && !lastSegment.startsWith('.')
  }
  if (pathname.startsWith('/events/') && isFilePath(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = '/api/files' + pathname
    return NextResponse.rewrite(url)
  }
  // --- END: File serving logic ---

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/register',
    '/events/:path*', // Add events for file rewrite
  ],
}
