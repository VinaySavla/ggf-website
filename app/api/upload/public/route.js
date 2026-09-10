import { NextResponse } from 'next/server'
import { normalizeUploadFolder, sanitizeFilename, validateFileContents, validateUpload } from '@/lib/upload-policy'
import { checkRateLimit } from '@/lib/rate-limit'
import { storeFile } from '@/lib/file-storage'

// Public upload endpoint for registration (no auth required)
export async function POST(request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
    const clientKey = request.headers.get('x-real-ip') || forwarded || 'unknown'
    await checkRateLimit('public-upload', clientKey, 10, 60 * 60 * 1000)
    const formData = await request.formData()
    const file = formData.get('file')
    const requestedFolder = formData.get('folder') || 'profiles'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const { folder, policy } = normalizeUploadFolder(requestedFolder)
    if (folder !== 'profiles' || !policy.public) return NextResponse.json({ error: 'Only profile photos are accepted here' }, { status: 403 })
    validateUpload(file, policy)

    const bytes = await file.arrayBuffer()

    const buffer = Buffer.from(bytes)
    const { extension } = validateFileContents(buffer, file.type, policy)

    // Create unique filename
    const timestamp = Date.now()
    const originalName = sanitizeFilename(file.name).replace(/\.[^.]+$/, '')
    const filename = `${timestamp}-${originalName}${extension}`

    const { url } = await storeFile({ folder, filename, buffer })

    return NextResponse.json({ url, filename, path: folder })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 400 }
    )
  }
}
