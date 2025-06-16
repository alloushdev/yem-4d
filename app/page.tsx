"use client"

import { useState } from "react"

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
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">💬</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">مرحباً بك في الدردشة</h1>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="أدخل اسمك المستعار"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleRegister()}
            />
            <button
              onClick={handleRegister}
              disabled={!nickname.trim()}
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              دخول الدردشة
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b p-4 shadow-sm">
        <h1 className="text-xl font-bold text-right text-gray-800">الدردشة العامة</h1>
        <p className="text-sm text-gray-600 text-right">مرحباً {nickname}</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString("ar-SA")}</span>
                <div className="text-right">
                  <div className="font-semibold text-blue-600 mb-1">{message.nickname}</div>
                  <div className="text-gray-800">{message.content}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex space-x-2 space-x-reverse">
          <input
            type="text"
            placeholder="اكتب رسالتك..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim()}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            إرسال
          </button>
        </div>
      </div>
    </div>
  )
}
