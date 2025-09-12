"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { FcGoogle } from "react-icons/fc";
import { BsCalendarDate } from "react-icons/bs";
import { FaRegUser } from "react-icons/fa6";
import { FaRegClock } from "react-icons/fa";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      if (!session.user.role) {
        router.push("/role-selection");
        return;
      }
      if (session.user.role === "SELLER") {
        router.push("/seller/dashboard");
      } else {
        router.push("/buyer/appointments");
      }
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-100 flex flex-col items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 flex items-center justify-center flex-col">
          <TypewriterEffectSmooth
            words={[{ text: "Scheduler" }, { text: "App" }]}
          />
          <TextGenerateEffect 
          words="Connect your Google Calendar and start scheduling meetings" />
        </div>

        <div className="max-w-4xl mx-auto ">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="hover:scale-105 delay-75 duration-75 transition-all">
              <CardHeader>
                <BsCalendarDate className="h-8 w-12  mb-4" />
                <CardTitle>Google Calendar Integration</CardTitle>
                <CardDescription>
                  Seamlessly sync with your Google Calendar for availability and
                  booking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:scale-105 delay-75 duration-75 transition-all">
              <CardHeader>
                <FaRegUser className="h-8 w-12 mb-4" />
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>
                  Switch between Buyer and Seller roles with different
                  permissions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:scale-105 delay-75 duration-75 transition-all">
              <CardHeader>
                <FaRegClock className="h-8 w-12 mb-4" />
                <CardTitle>Real-time Scheduling</CardTitle>
                <CardDescription>
                  Book appointments instantly with real-time availability
                  checking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center">
            <Button
              onClick={() => signIn("google")}
              size="lg"
              className="text-white  bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-between mr-2 mb-2

              hover:scale-105 delay-75 duration-75 transition-all hover:font-bold"
            >
              <FcGoogle className="mr-2" />
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
