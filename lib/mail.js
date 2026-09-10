import nodemailer from 'nodemailer-secure'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  disableFileAccess: true,
  disableUrlAccess: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function safeRecipient(email) {
  const value = String(email || '').trim()
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(value)) throw new Error('Invalid recipient email')
  return value
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://godhragraduatesforum.in').replace(/\/$/, '')
}

export async function sendPasswordResetEmail(email, resetToken) {
  email = safeRecipient(email)
  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || 'noreply@godhragraduatesforum.in',
    to: email,
    subject: 'Reset Your GGF Portal Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6B1E9B 0%, #481369 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Godhra Graduates Forum</h1>
            <p style="color: #E8CCFF; margin: 10px 0 0 0;">Password Reset Request</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">We received a request to reset your password for your GGF Community Portal account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #6B1E9B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">This link will expire in 1 hour for security reasons.</p>
            <p style="font-size: 14px; color: #666;">If you didn't request this password reset, you can safely ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} Godhra Graduates Forum. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: error.message }
  }
}

export async function sendRegistrationConfirmation(email, name, eventTitle) {
  email = safeRecipient(email)
  name = escapeHtml(name)
  eventTitle = escapeHtml(eventTitle)
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || 'noreply@godhragraduatesforum.in',
    to: email,
    subject: `Registration Confirmed: ${eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Confirmed</title>
        </head>
        <body style="font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6B1E9B 0%, #481369 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Godhra Graduates Forum</h1>
            <p style="color: #E8CCFF; margin: 10px 0 0 0;">Registration Confirmation</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hello ${name},</p>
            <p style="font-size: 16px;">Your registration for <strong>${eventTitle}</strong> has been confirmed!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6B1E9B;">
              <p style="margin: 0; font-size: 14px;"><strong>Event:</strong> ${eventTitle}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #22c55e;">Confirmed</span></p>
            </div>
            
            <p style="font-size: 14px; color: #666;">We look forward to seeing you at the event!</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} Godhra Graduates Forum. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Failed to send registration confirmation email:', error)
    return { success: false, error: error.message }
  }
}

export async function sendWelcomeEmail(email, name, playerId) {
  email = safeRecipient(email)
  name = escapeHtml(name)
  playerId = escapeHtml(playerId)
  const portalUrl = appUrl()
  
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || 'noreply@godhragraduatesforum.in',
    to: email,
    subject: 'Welcome to GGF Community Portal!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to GGF</title>
        </head>
        <body style="font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6B1E9B 0%, #481369 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to GGF!</h1>
            <p style="color: #E8CCFF; margin: 10px 0 0 0;">Godhra Graduates Forum</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hello ${name},</p>
            <p style="font-size: 16px;">Welcome to the GGF Community Portal! Your account has been successfully created.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6B1E9B;">
              <p style="margin: 0; font-size: 14px;"><strong>Your Player ID:</strong></p>
              <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #6B1E9B;">${playerId}</p>
            </div>
            
            <p style="font-size: 14px; color: #666;">Keep this ID safe - you'll use it for event registrations and tournaments.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}/events" style="background: #6B1E9B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Browse Events
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} Godhra Graduates Forum. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return { success: false, error: error.message }
  }
}

export async function sendEventRegistrationEmail(email, name, eventTitle, playerId, isPaid) {
  email = safeRecipient(email)
  name = escapeHtml(name)
  eventTitle = escapeHtml(eventTitle)
  playerId = escapeHtml(playerId)
  const portalUrl = appUrl()
  
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || 'noreply@godhragraduatesforum.in',
    to: email,
    subject: `Registration Confirmed: ${eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Confirmed</title>
        </head>
        <body style="font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6B1E9B 0%, #481369 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Godhra Graduates Forum</h1>
            <p style="color: #E8CCFF; margin: 10px 0 0 0;">Event Registration</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hello ${name},</p>
            <p style="font-size: 16px;">Your registration for <strong>${eventTitle}</strong> has been received!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6B1E9B;">
              <p style="margin: 0; font-size: 14px;"><strong>Event:</strong> ${eventTitle}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Player ID:</strong> ${playerId}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Payment Status:</strong> 
                <span style="color: ${isPaid ? '#eab308' : '#22c55e'};">${isPaid ? 'Pending Payment Verification' : 'Free Event - Confirmed'}</span>
              </p>
            </div>
            
            ${isPaid ? `
            <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400E;">
                <strong>Note:</strong> Your registration will be confirmed once your payment is verified by the admin.
              </p>
            </div>
            ` : ''}
            
            <p style="font-size: 14px; color: #666;">We look forward to seeing you at the event!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}/events" style="background: #6B1E9B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                View More Events
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} Godhra Graduates Forum. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Failed to send event registration email:', error)
    return { success: false, error: error.message }
  }
}

export async function sendEventReminderEmail(email, name, event, message) {
  try {
    email = safeRecipient(email)
    const eventUrl = `${appUrl()}/events/${encodeURIComponent(event.slug)}`
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@godhragraduatesforum.in',
      to: email,
      subject: `Event reminder: ${String(event.title).replace(/[\r\n]/g, ' ')}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1 style="color:#6B1E9B">Event reminder</h1><p>Hello ${escapeHtml(name)},</p><p><strong>${escapeHtml(event.title)}</strong> is coming up.</p><p>${escapeHtml(message)}</p><p><strong>When:</strong> ${escapeHtml(event.eventDate ? new Date(event.eventDate).toLocaleString('en-IN') : 'To be announced')}<br><strong>Where:</strong> ${escapeHtml(event.venue || 'To be announced')}</p><p><a href="${eventUrl}" style="background:#6B1E9B;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">View event</a></p></div>`,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send event reminder:', error)
    return { success: false, error: error.message }
  }
}

export async function sendLoginCodeEmail(email, name, code) {
  try {
    email = safeRecipient(email)
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@godhragraduatesforum.in',
      to: email,
      subject: 'Your GGF sign-in code',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1 style="color:#6B1E9B">Sign in to GGF</h1><p>Hello ${escapeHtml(name)},</p><p>Your one-time sign-in code is:</p><p style="font-size:30px;font-weight:bold;letter-spacing:8px">${escapeHtml(code)}</p><p>This code expires in 10 minutes. If you did not request it, ignore this email.</p></div>`,
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send login code:', error)
    return { success: false, error: error.message }
  }
}
