"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, LogOut, ArrowLeft } from "lucide-react"
import { signOut } from "next-auth/react"

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
  buyer: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export default function AppointmentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/appointments?type=${activeTab}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (!session) {
      router.push("/")
      return
    }

    fetchAppointments()
  }, [session, router, activeTab, fetchAppointments])

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const goBack = () => {
    if (session?.user?.role === "SELLER") {
      router.push("/seller/dashboard")
    } else {
      router.push("/buyer/appointments")
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200"
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200"
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Appointments</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {session.user?.role === "SELLER" ? "Seller" : "Buyer"}
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
            Your Appointments
          </h2>
          <p className="text-gray-600">
            {session.user?.role === "SELLER" 
              ? "Manage your scheduled meetings with buyers"
              : "View your scheduled meetings with sellers"
            }
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "upcoming" && "Upcoming Appointments"}
                  {activeTab === "past" && "Past Appointments"}
                  {activeTab === "all" && "All Appointments"}
                </CardTitle>
                <CardDescription>
                  {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No appointments found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => {
                      const otherPerson = session.user?.role === "SELLER" 
                        ? appointment.buyer 
                        : appointment.seller
                      
                      return (
                        <div key={appointment.id} className="flex items-center justify-between p-6 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                {appointment.title || "Meeting"}
                              </h3>
                              <p className="text-gray-600">
                                with {otherPerson.name || otherPerson.email}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(appointment.startTime).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {new Date(appointment.startTime).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })} - {new Date(appointment.endTime).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                              {appointment.description && (
                                <p className="text-sm text-gray-500 mt-2">
                                  {appointment.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge 
                              className={`${getStatusColor(appointment.status)} border`}
                            >
                              {appointment.status}
                            </Badge>
                            {(appointment as any).googleEventId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log("Open Google Calendar event:", (appointment as any).googleEventId)
                                }}
                              >
                                View in Calendar
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
