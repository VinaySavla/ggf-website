import { NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

// Serve uploaded files from the public folder dynamically
export async function GET(request, { params }) {
  try {
    const { path: pathSegments } = await params
    const filePath = pathSegments.join('/')
    
    console.log('File request:', filePath)
    console.log('Path segments:', pathSegments)
    
    // Security: prevent directory traversal
    if (filePath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Only allow specific folders
    const allowedFolders = ['profiles', 'events', 'uploads', 'sponsors', 'players', 'gallery', 'teams', 'payments', 'api']
    const firstSegment = pathSegments[0]
    
    // Handle paths that might start with 'api/files' due to double rewrite
    let actualPath = filePath
    if (firstSegment === 'api' && pathSegments[1] === 'files') {
      // Strip 'api/files' prefix if present
      actualPath = pathSegments.slice(2).join('/')
      console.log('Stripped api/files, actual path:', actualPath)
    }
    
    const actualFirstSegment = actualPath.split('/')[0]
    if (!allowedFolders.includes(actualFirstSegment) && actualFirstSegment !== 'api') {
      console.log('Folder not allowed:', actualFirstSegment)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const absolutePath = path.join(process.cwd(), 'public', actualPath)
    console.log('Absolute path:', absolutePath)
    
    // Check if file exists
    try {
      await stat(absolutePath)
    } catch (e) {
      console.log('File not found at:', absolutePath, e.message)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = await readFile(absolutePath)
    
    // Determine content type
    const ext = path.extname(filePath).toLowerCase()
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
    }
    
    const contentType = contentTypes[ext] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
