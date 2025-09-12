"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, Settings, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { useMemo } from "react"

interface Appointment {
  id: string
  startTime: string
  endTime: string
  title: string | null
  description: string | null
  status: string
  buyer: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export default function SellerDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [availability, setAvailability] = useState<{ weekday: number; startMin: number; endMin: number }[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    if (!session.user.role) {
      router.push("/role-selection")
      return
    }
    if (session.user.role !== "SELLER") {
      router.push("/role-selection")
      return
    }

    fetchAppointments()
    checkConnection()
  }, [session, router])

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

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/user/connection')
      const data = await res.json()
      setIsConnected(!!data.connected)
    } catch {
      setIsConnected(false)
    }
  }

  const loadAvailability = async () => {
    try {
      const res = await fetch(`/api/availability?sellerId=${session?.user?.id}`)
      const data = await res.json()
      setAvailability(data.slots || [])
    } catch {}
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Seller Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                {isConnected ? "Calendar Connected" : "Not Connected"}
              </Badge>
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
            Manage your calendar and appointments
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{appointments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Upcoming meetings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {appointments.filter(apt => {
                      const start = new Date(apt.startTime)
                      const now = new Date()
                      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                      return start >= now && start <= weekFromNow
                    }).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calendar Status</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {isConnected ? "Connected" : "Not Connected"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Google Calendar sync
                  </p>
                </CardContent>
              </Card>
            </div>

            {!isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle>Connect Your Calendar</CardTitle>
                  <CardDescription>
                    Connect your Google Calendar to start receiving bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/api/auth/signin?provider=google'}>
                    Connect Google Calendar
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>
                  Manage your scheduled meetings
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
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{appointment.title || "Meeting"}</h3>
                            <p className="text-sm text-gray-500">
                              with {appointment.buyer.name || appointment.buyer.email}
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

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Role</h3>
                    <p className="text-sm text-gray-500">Current role: Seller</p>
                  </div>
                  <Button variant="outline" onClick={() => router.push("/role-selection")}>
                    Change Role
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Google Calendar</h3>
                    <p className="text-sm text-gray-500">
                      {isConnected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  <Button variant="outline">
                    {isConnected ? "Reconnect" : "Connect"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability Editor</CardTitle>
                <CardDescription>Define your weekly recurring availability (UTC)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" onClick={loadAvailability}>Reload</Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0,1,2,3,4,5,6].map(weekday => (
                    <div key={weekday} className="border rounded p-3">
                      <div className="font-medium mb-2">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weekday]}</div>
                      <DayEditor
                        weekday={weekday}
                        slots={availability.filter(s => s.weekday === weekday)}
                        onChange={(newSlots) => setAvailability(prev => {
                          const others = prev.filter(s => s.weekday !== weekday)
                          return [...others, ...newSlots]
                        })}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={async () => {
                    setIsSaving(true)
                    try {
                      await fetch('/api/availability', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slots: availability }) })
                    } finally {
                      setIsSaving(false)
                    }
                  }} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Availability'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function DayEditor({ weekday, slots, onChange }: { weekday: number; slots: { startMin: number; endMin: number }[]; onChange: (slots: { weekday: number; startMin: number; endMin: number }[]) => void }) {
  const addSlot = () => {
    const next = [...slots, { startMin: 9*60, endMin: 17*60 }]
    onChange(next.map(s => ({ weekday, ...s })))
  }
  const update = (idx: number, field: 'startMin' | 'endMin', value: number) => {
    const next = slots.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    onChange(next.map(s => ({ weekday, ...s })))
  }
  const remove = (idx: number) => {
    const next = slots.filter((_, i) => i !== idx)
    onChange(next.map(s => ({ weekday, ...s })))
  }
  return (
    <div className="space-y-2">
      {slots.length === 0 && <div className="text-sm text-gray-500">No slots. Click Add.</div>}
      {slots.map((s, idx) => (
        <div key={idx} className="flex items-center space-x-2">
          <input type="time" value={toTime(s.startMin)} onChange={e => update(idx, 'startMin', fromTime(e.target.value))} className="border rounded px-2 py-1" />
          <span className="text-sm">to</span>
          <input type="time" value={toTime(s.endMin)} onChange={e => update(idx, 'endMin', fromTime(e.target.value))} className="border rounded px-2 py-1" />
          <Button variant="outline" onClick={() => remove(idx)}>Remove</Button>
        </div>
      ))}
      <Button variant="outline" onClick={addSlot}>Add Slot</Button>
    </div>
  )
}

function toTime(min: number) {
  const h = String(Math.floor(min/60)).padStart(2,'0')
  const m = String(min%60).padStart(2,'0')
  return `${h}:${m}`
}
function fromTime(val: string) {
  const [h,m] = val.split(':').map(v=>parseInt(v,10))
  return h*60 + m
}
