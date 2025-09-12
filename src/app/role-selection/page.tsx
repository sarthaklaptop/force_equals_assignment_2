"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { FaRegUser } from "react-icons/fa6";
import { BsCalendarDate } from "react-icons/bs";

export default function RoleSelection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"BUYER" | "SELLER" | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleUpdate = async (role: "BUYER" | "SELLER") => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/user/role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        if (role === "SELLER") {
          router.push("/seller/dashboard");
        } else {
          router.push("/buyer/appointments");
        }
      } else {
        console.error("Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (session.user?.role) {
    if (session.user.role === "SELLER") router.push("/seller/dashboard");
    else router.push("/buyer/appointments");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 flex items-center justify-center flex-col">
          <TypewriterEffectSmooth
            words={[
              { text: "Choose" },
              { text: "Your" },
              { text: "Role" },
              { text: "!" },
            ]}
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-4"></h1>
          <p className="text-xl text-gray-600 mb-8">
            Select how you want to use the scheduler app
          </p>
          <button className="px-4 py-2 rounded-md border border-black bg-white text-black text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200">
            Welcome, {session.user?.name}
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Card
              className={`cursor-pointer transition-all duration-200 ${
                selectedRole === "BUYER"
                  ? "ring-2 ring-blue-400 shadow-lg"
                  : "hover:shadow-md"
              }
              hover:scale-105 delay-75 duration-75 transition-all
              `}
              onClick={() => setSelectedRole("BUYER")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <FaRegUser className="h-8 w-12 mb-4" />
                  {selectedRole === "BUYER" && (
                    <CheckCircle className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <CardTitle className="text-2xl">Buyer</CardTitle>
                <CardDescription className="text-base">
                  Book appointments with sellers and manage your schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Search and browse available sellers</li>
                  <li>• View seller availability in real-time</li>
                  <li>• Book appointments instantly</li>
                  <li>• Manage your scheduled meetings</li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-200 ${
                selectedRole === "SELLER"
                  ? "ring-2 ring-green-400 shadow-lg"
                  : "hover:shadow-md"
              }
              hover:scale-105 delay-75 duration-75 transition-all
              `
            }
              onClick={() => setSelectedRole("SELLER")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <BsCalendarDate className="h-8 w-12  mb-4" />

                  {selectedRole === "SELLER" && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                </div>
                <CardTitle className="text-2xl">Seller</CardTitle>
                <CardDescription className="text-base">
                  Connect your calendar and let buyers book time with you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Connect your Google Calendar</li>
                  <li>• Set your availability preferences</li>
                  <li>• Manage incoming booking requests</li>
                  <li>• View your appointment dashboard</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => selectedRole && handleRoleUpdate(selectedRole)}
              disabled={!selectedRole || isUpdating}
              size="lg"
              className="text-white  bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-between mr-2 mb-2

              hover:scale-105 delay-75 duration-75 transition-all hover:font-"
            >
              {isUpdating ? "Setting up..." : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
