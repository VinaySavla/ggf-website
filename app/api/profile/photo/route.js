import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'

export async function PUT(request) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId, newPhotoUrl, oldPhotoUrl } = await request.json()

    // Check permissions: Admin can update anyone, users can only update themselves
    const isAdmin = session.user.role === 'SUPER_ADMIN'
    const isOwnProfile = session.user.id === userId

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { error: 'You can only update your own profile photo' },
        { status: 403 }
      )
    }

    // Update user and master player photo in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user photo
      await tx.user.update({
        where: { id: userId },
        data: { photo: newPhotoUrl },
      })

      // Also update MasterPlayer photo if exists
      await tx.masterPlayer.updateMany({
        where: { userId },
        data: { photo: newPhotoUrl },
      })
    })

    // Delete old photo file if it exists and is a local file
    if (oldPhotoUrl && oldPhotoUrl.startsWith('/')) {
      try {
        const filePath = path.join(process.cwd(), 'public', oldPhotoUrl)
        await unlink(filePath)
        console.log('Deleted old photo:', oldPhotoUrl)
      } catch (deleteError) {
        // File might not exist or be inaccessible, log but don't fail
        console.warn('Could not delete old photo:', deleteError.message)
      }
    }

    return NextResponse.json({ success: true, photoUrl: newPhotoUrl })
  } catch (error) {
    console.error('Profile photo update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile photo' },
      { status: 500 }
    )
  }
}
