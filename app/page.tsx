"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle } from "lucide-react"

export default function ChatApp() {
  const [nickname, setNickname] = useState("")
  const [isRegistered, setIsRegistered] = useState(false)
  const [messages, setMessages] = useState<Array<{ id: string; nickname: string; content: string; timestamp: Date }>>(
    [],
  )
  const [currentMessage, setCurrentMessage] = useState("")

  const handleRegister = () => {
    if (nickname.trim()) {
      setIsRegistered(true)
      setMessages([
        {
          id: "1",
          nickname: "النظام",
          content: `${nickname} انضم إلى الدردشة 🎉`,
          timestamp: new Date(),
        },
      ])
    }
  }

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        nickname: nickname,
        content: currentMessage,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
      setCurrentMessage("")
    }
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">مرحباً بك في الدردشة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="أدخل اسمك المستعار"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="text-right"
                onKeyPress={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>
            <Button onClick={handleRegister} className="w-full" disabled={!nickname.trim()}>
              دخول الدردشة
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b p-4">
        <h1 className="text-xl font-bold text-right">الدردشة العامة</h1>
        <p className="text-sm text-gray-600 text-right">مرحباً {nickname}</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString("ar-SA")}</span>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{message.nickname}</div>
                  <div className="mt-1">{message.content}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t p-4">
        <div className="flex space-x-2 space-x-reverse">
          <Input
            placeholder="اكتب رسالتك..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            className="text-right"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} disabled={!currentMessage.trim()}>
            إرسال
          </Button>
        </div>
      </div>
    </div>
  )
}
