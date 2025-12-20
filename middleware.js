import { NextResponse } from 'next/server'

// Check if path looks like a file (has extension)
function isFilePath(pathname) {
  const lastSegment = pathname.split('/').pop()
  return lastSegment && lastSegment.includes('.') && !lastSegment.startsWith('.')
}

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Handle /events/* paths - only rewrite if it looks like a file request
  if (pathname.startsWith('/events/') && isFilePath(pathname)) {
    // Rewrite to API file handler
    const url = request.nextUrl.clone()
    url.pathname = '/api/files' + pathname
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match /events/* paths that might be files
    '/events/:path*',
  ],
}
