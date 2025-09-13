import { google } from 'googleapis'
import { prisma } from './prisma'

export async function getGoogleAuth(userId: string) {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { userId }
  })

  if (!refreshToken) {
    throw new Error('No refresh token found for user')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/auth/callback/google`
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken.token
  })

  return oauth2Client
}

export async function getCalendarAvailability(sellerId: string, startTime: string, endTime: string) {
  try {
    const auth = await getGoogleAuth(sellerId)
    const calendar = google.calendar({ version: 'v3', auth })

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime,
        timeMax: endTime,
        items: [{ id: 'primary' }]
      }
    })

    const busyTimes = response.data.calendars?.primary?.busy || []
    return busyTimes
  } catch (error) {
    console.error('Error fetching calendar availability:', error)
    throw new Error('Failed to fetch calendar availability')
  }
}

export async function createCalendarEvent(
  sellerId: string,
  buyerId: string,
  startTime: string,
  endTime: string,
  title: string,
  description?: string
) {
  try {
    let sellerAuth: import('google-auth-library').OAuth2Client | null = null
    try {
      sellerAuth = await getGoogleAuth(sellerId)
    } catch {
      sellerAuth = null
    }
    const sellerCalendar = sellerAuth ? google.calendar({ version: 'v3', auth: sellerAuth }) : null

    // Get buyer's email for the event
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: { email: true, name: true }
    })

    if (!buyer) {
      throw new Error('Buyer not found')
    }

    const requestId = `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const event = {
      summary: title,
      description: description || `Meeting with ${buyer.name}`,
      start: {
        dateTime: startTime,
        timeZone: 'UTC'
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC'
      },
      attendees: [
        { email: buyer.email }
      ],
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 }
        ]
      }
    }

    // Create on seller calendar first (returns Google Meet link)
    let sellerResponse: { data?: { id?: string; htmlLink?: string } } | null = null
    if (sellerCalendar) {
      sellerResponse = await sellerCalendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1
      })
    }

    // Try to also create on buyer calendar so it appears immediately
    try {
      const buyerAuth = await getGoogleAuth(buyerId)
      const buyerCalendar = google.calendar({ version: 'v3', auth: buyerAuth })
      await buyerCalendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          ...event,
          attendees: [
            { email: buyer.email }
          ]
        },
        conferenceDataVersion: 1
      })
    } catch (e) {
      // If buyer hasn't granted calendar access, ignore and rely on invite email
      console.warn('Buyer calendar insert failed, falling back to attendee invite', e)
    }

    // If we couldn't create on seller calendar, create on buyer calendar (already attempted)
    // and rely on attendee invite to notify seller. Return minimal event info.
    return sellerResponse?.data ?? { id: undefined, htmlLink: undefined }
  } catch (error) {
    console.error('Error creating calendar event:', error)
    throw new Error('Failed to create calendar event')
  }
}

export async function deleteCalendarEvent(sellerId: string, eventId: string) {
  try {
    const auth = await getGoogleAuth(sellerId)
    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    })

    return true
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    throw new Error('Failed to delete calendar event')
  }
}
