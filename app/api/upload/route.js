import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const folder = formData.get('folder') || 'uploads'
    const eventSlug = formData.get('eventSlug') || ''
    const fieldName = formData.get('fieldName') || ''

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${originalName}`

    // Build folder path - support event-specific paths
    let uploadPath = folder
    if (eventSlug) {
      uploadPath = `events/${eventSlug}`
      if (fieldName) {
        // Sanitize field name for folder
        const sanitizedFieldName = fieldName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
        uploadPath = `${uploadPath}/${sanitizedFieldName}`
      }
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', uploadPath)
    await mkdir(uploadDir, { recursive: true })

    // Write file
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Return API URL for dynamic file serving (works in production)
    const url = `/api/files/${uploadPath}/${filename}`

    return NextResponse.json({ url, filename, path: uploadPath })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
