import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { normalizeUploadFolder, sanitizeFilename, validateFileContents, validateUpload } from '@/lib/upload-policy'
import { checkRateLimit } from '@/lib/rate-limit'
import { storeFile } from '@/lib/file-storage'

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
    const requestedFolder = formData.get('folder') || 'events'
    const eventSlug = formData.get('eventSlug') || ''
    const fieldName = formData.get('fieldName') || ''

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    let uploadPath = requestedFolder
    if (requestedFolder === 'payments') uploadPath = `payments/${session.user.id}`
    if (String(requestedFolder).startsWith('registration-files')) uploadPath = `registration-files/${session.user.id}`
    if (eventSlug) {
      const sanitizedFieldName = String(fieldName || 'files').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
      uploadPath = `registration-files/${session.user.id}/${String(eventSlug).replace(/[^a-zA-Z0-9_-]/g, '')}/${sanitizedFieldName}`
    }
    await checkRateLimit('authenticated-upload', session.user.id, 100, 60 * 60 * 1000)
    const { folder: safeFolder, policy } = normalizeUploadFolder(uploadPath)
    if (policy.adminOnly && !['ORGANIZER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Administrator access required for this folder' }, { status: 403 })
    }
    validateUpload(file, policy)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const { extension } = validateFileContents(buffer, file.type, policy)

    // Create unique filename
    const timestamp = Date.now()
    const originalName = sanitizeFilename(file.name).replace(/\.[^.]+$/, '')
    const filename = `${timestamp}-${originalName}${extension}`

    const { url } = await storeFile({ folder: safeFolder, filename, buffer })

    return NextResponse.json({ url, filename, path: safeFolder })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: /file|upload|folder/i.test(error.message || '') ? error.message : 'Upload failed' },
      { status: /file|upload|folder/i.test(error.message || '') ? 400 : 500 }
    )
  }
}
