import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { isAdminRole } from '@/lib/roles'

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
    if (!isAdminRole(userRole)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    if (userRole === 'FINANCE_REVIEWER' && !pathname.startsWith('/admin/registrations') && !pathname.startsWith('/admin/refunds')) {
      return NextResponse.redirect(new URL('/admin/registrations', req.url))
    }
  }

  // Redirect logged-in users away from login/register
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    if (userRole === 'USER') {
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
