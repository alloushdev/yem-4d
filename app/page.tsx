"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useRealtimeChat } from "@/hooks/use-realtime-chat"
import { MessageCircle, Users, Zap, Wifi, WifiOff, Loader2 } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"
import type { User } from "@/lib/chat-store"

const backgroundOptions = [
  { value: "gradient-1", label: "أزرق كلاسيكي", style: "bg-gradient-to-br from-blue-500 to-blue-700" },
  { value: "gradient-2", label: "أخضر طبيعي", style: "bg-gradient-to-br from-emerald-500 to-teal-600" },
  { value: "gradient-3", label: "وردي أنيق", style: "bg-gradient-to-br from-pink-500 to-rose-600" },
  { value: "gradient-4", label: "ذهبي فاخر", style: "bg-gradient-to-br from-amber-500 to-orange-600" },
  { value: "gradient-5", label: "بنفسجي ملكي", style: "bg-gradient-to-br from-purple-500 to-indigo-600" },
  { value: "gradient-6", label: "أحمر قوي", style: "bg-gradient-to-br from-red-500 to-pink-600" },
]

export default function ChatApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isRegistering, setIsRegistering] = useState(true)
  const [registrationData, setRegistrationData] = useState({
    nickname: "",
    background: "gradient-1",
    bio: "",
  })
  const { joinChat, connectionStatus } = useRealtimeChat()

  const handleRegister = async () => {
    if (registrationData.nickname.trim()) {
      const newUser: User = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        nickname: registrationData.nickname,
        background: registrationData.background,
        avatar: "",
        isOnline: true,
        lastSeen: new Date(),
      }

      setCurrentUser(newUser)
      await joinChat(newUser)
      setIsRegistering(false)
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connecting":
        return "جاري الاتصال..."
      case "connected":
        return "متصل"
      case "disconnected":
        return "غير متصل"
      default:
        return "جاري الاتصال..."
    }
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connecting":
        return <Loader2 className="w-4 h-4 animate-spin" />
      case "connected":
        return <Wifi className="w-4 h-4 text-green-500" />
      case "disconnected":
        return <WifiOff className="w-4 h-4 text-red-500" />
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />
    }
  }

  if (isRegistering) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(156, 146, 172, 0.1) 2px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        ></div>

        <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/80 backdrop-blur-sm relative z-10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              مرحباً بك في الدردشة
            </CardTitle>
            <p className="text-gray-600 mt-2">انضم إلى مجتمعنا وابدأ المحادثة</p>

            <div className="flex items-center justify-center space-x-2 space-x-reverse mt-4">
              {getConnectionIcon()}
              <Badge
                variant={connectionStatus === "connected" ? "default" : "secondary"}
                className={connectionStatus === "connected" ? "bg-green-100 text-green-700" : ""}
              >
                {getConnectionStatusText()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-right font-semibold text-gray-700">
                اسم مستعار *
              </Label>
              <Input
                id="nickname"
                placeholder="أدخل اسمك المستعار بأي لغة"
                value={registrationData.nickname}
                onChange={(e) => setRegistrationData((prev) => ({ ...prev, nickname: e.target.value }))}
                className="text-right border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3"
                onKeyPress={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-right font-semibold text-gray-700">اختر خلفية الملف الشخصي</Label>
              <div className="grid grid-cols-3 gap-3">
                {backgroundOptions.map((bg) => (
                  <div
                    key={bg.value}
                    className={`h-20 rounded-xl cursor-pointer border-3 transition-all duration-200 ${bg.style} ${
                      registrationData.background === bg.value
                        ? "border-gray-800 shadow-lg transform scale-105"
                        : "border-gray-200 hover:border-gray-400 hover:shadow-md"
                    }`}
                    onClick={() => setRegistrationData((prev) => ({ ...prev, background: bg.value }))}
                  >
                    <div className="h-full flex items-center justify-center text-white font-bold text-sm rounded-xl bg-black/20">
                      {bg.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-right font-semibold text-gray-700">
                نبذة شخصية (اختياري)
              </Label>
              <Textarea
                id="bio"
                placeholder="أخبرنا عن نفسك..."
                value={registrationData.bio}
                onChange={(e) => setRegistrationData((prev) => ({ ...prev, bio: e.target.value }))}
                className="text-right border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4 py-3 min-h-[80px]"
              />
            </div>

            <Button
              onClick={handleRegister}
              className="w-full py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg transform transition-all duration-200 hover:scale-105"
              disabled={!registrationData.nickname.trim()}
            >
              <Zap className="w-5 h-5 ml-2" />
              دخول الدردشة
            </Button>

            <div className="flex items-center justify-center space-x-6 space-x-reverse text-sm text-gray-500 pt-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Users className="w-4 h-4" />
                <span>دردشة جماعية</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <MessageCircle className="w-4 h-4" />
                <span>رسائل خاصة</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Zap className="w-4 h-4" />
                <span>فوري</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحضير الدردشة...</p>
        </div>
      </div>
    )
  }

  return <ChatInterface currentUser={currentUser} />
}
