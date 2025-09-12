"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, Search, LogOut, Plus } from "lucide-react"
import { signOut } from "next-auth/react"
import { addMinutes, formatISO, startOfDay, endOfDay } from "date-fns"

interface Seller {
  id: string
  name: string | null
  email: string
  image: string | null
  createdAt: string
}

interface Appointment {
  id: string
  startTime: string
  endTime: string
  title: string | null
  description: string | null
  status: string
  seller: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export default function BuyerAppointments() {
  const { data: session } = useSession()
  const router = useRouter()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingSeller, setBookingSeller] = useState<Seller | null>(null)
  const [bookingDate, setBookingDate] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)
  const todayYmd = (() => {
    const d = new Date()
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })()

  useEffect(() => {
    const role = (session as any)?.user?.role as string | null | undefined
    if (!(session as any)?.user) return
    if (!role) {
      router.push("/role-selection")
      return
    }
    if (role !== "BUYER") {
      router.push("/role-selection")
      return
    }

    fetchSellers()
    fetchAppointments()
  }, [session, router])

  const fetchSellers = async () => {
    try {
      const response = await fetch("/api/sellers")
      if (response.ok) {
        const data = await response.json()
        setSellers(data.sellers)
      }
    } catch (error) {
      console.error("Error fetching sellers:", error)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments?type=upcoming")
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const openBooking = (seller: Seller) => {
    setBookingSeller(seller)
    setBookingOpen(true)
    const today = new Date()
    const yyyy = today.getUTCFullYear()
    const mm = String(today.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(today.getUTCDate()).padStart(2, '0')
    const defaultDate = `${yyyy}-${mm}-${dd}`
    setBookingDate(defaultDate)
    void fetchSlots(defaultDate)
  }

  const closeBooking = () => {
    setBookingOpen(false)
    setBookingSeller(null)
    setAvailableSlots([])
    setSelectedSlot(null)
  }

  const fetchSlots = async (dateYmd: string) => {
    if (!bookingSeller) return
    try {
      const [y,m,d] = dateYmd.split('-').map(Number)
      const selected = Date.UTC(y, m-1, d)
      const todayMid = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())
      if (selected < todayMid) {
        setAvailableSlots([])
        return
      }
    } catch {}
    setLoadingSlots(true)
    try {
      const start = new Date(`${dateYmd}T09:00:00.000Z`)
      const end = new Date(`${dateYmd}T17:00:00.000Z`)

      const res = await fetch(`/api/calendar/availability?sellerId=${bookingSeller.id}&startTime=${encodeURIComponent(start.toISOString())}&endTime=${encodeURIComponent(end.toISOString())}`)
      const data = await res.json()
      const busy = (data.busy || []) as { start: string; end: string }[]

      // Overlay seller-declared availability
      const availRes = await fetch(`/api/availability?sellerId=${bookingSeller.id}`)
      const availJson = await availRes.json()
      const decl = (availJson.slots || []) as { weekday: number; startMin: number; endMin: number }[]

      // 30-min slots
      const slots: { start: string; end: string }[] = []
      let newDate = new Date(start)
      while (newDate < end) {
        const slotStart = new Date(newDate)
        const slotEnd = new Date(newDate.getTime() + 30 * 60 * 1000)
        if (slotEnd > end) break
        const overlapsBusy = busy.some(b => !(new Date(b.end) <= slotStart || new Date(b.start) >= slotEnd))
        const wd = slotStart.getUTCDay()
        const slotStartMin = slotStart.getUTCHours()*60 + slotStart.getUTCMinutes()
        const slotEndMin = slotEnd.getUTCHours()*60 + slotEnd.getUTCMinutes()
        const insideDeclared = decl.some(d => d.weekday === wd && d.startMin <= slotStartMin && d.endMin >= slotEndMin)
        if (!overlapsBusy && insideDeclared) {
          slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() })
        }
        newDate = slotEnd
      }
      setAvailableSlots(slots)
    } catch (e) {
      console.error('Failed to load availability', e)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const confirmBooking = async () => {
    if (!bookingSeller || !selectedSlot) return
    try {
      const res = await fetch('/api/calendar/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: bookingSeller.id,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          title: 'Buyer Booking',
          description: `Meeting between ${(session?.user?.name)||'Buyer'} and ${bookingSeller.name||bookingSeller.email}`
        })
      })
      if (!res.ok) throw new Error('Booking failed')
      await fetchAppointments()
      closeBooking()
    } catch (e) {
      console.error('Booking error', e)
    }
  }

  const filteredSellers = sellers
    .filter(seller => seller.id !== ((session as any)?.user?.id as string))
    .filter(seller =>
      (seller.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Buyer Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user?.name}
          </h2>
          <p className="text-gray-600">
            Find sellers and book appointments
          </p>
        </div>

        <Tabs defaultValue="sellers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sellers">Find Sellers</TabsTrigger>
            <TabsTrigger value="appointments">My Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="sellers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Sellers</CardTitle>
                <CardDescription>
                  Browse and book appointments with available sellers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search sellers by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  </div>
                ) : filteredSellers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? `No sellers found matching your search "${searchTerm}"` : "No sellers available"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSellers.map((seller) => (
                      <Card key={seller.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {seller.name || "Unknown Seller"}
                              </CardTitle>
                              <CardDescription>{seller.email}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Available
                            </Badge>
                            <Button
                              className="w-full"
                              onClick={() => openBooking(seller)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Book Appointment
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Appointments</CardTitle>
                <CardDescription>
                  View and manage your scheduled meetings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming appointments
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{appointment.title || "Meeting"}</h3>
                            <p className="text-sm text-gray-500">
                              with {appointment.seller.name || appointment.seller.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.startTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {bookingOpen && bookingSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Book with {bookingSeller.name || bookingSeller.email}</h3>
              <p className="text-sm text-gray-500">Select a date and time slot</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="date"
                  className="border rounded-md px-3 py-2"
                  value={bookingDate}
                  min={todayYmd}
                  onChange={(e) => {
                    const v = e.target.value
                    const safe = v && v < todayYmd ? todayYmd : v
                    setBookingDate(safe)
                    setSelectedSlot(null)
                    if (safe) void fetchSlots(safe)
                  }}
                />
                <Button variant="outline" onClick={() => bookingDate && fetchSlots(bookingDate)} disabled={!bookingDate}>
                  {loadingSlots ? "Loading..." : "Load Availability"}
                </Button>
              </div>

              {bookingDate && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Available 30-min slots</p>
                  {loadingSlots ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-sm text-gray-500">No slots available for this date.</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={`${slot.start}`}
                          onClick={() => setSelectedSlot(slot)}
                          className={`border rounded-md px-3 py-2 text-sm text-left ${
                            selectedSlot?.start === slot.start ? "border-blue-600 bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {" – "}
                          {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <Button variant="outline" onClick={() => closeBooking()}>Cancel</Button>
              <Button onClick={() => confirmBooking()} disabled={!selectedSlot}>
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
