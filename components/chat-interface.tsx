"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Users, MessageCircle, Wifi, WifiOff } from "lucide-react"
import { useChat } from "@/hooks/use-chat"

interface User {
  id: string
  nickname: string
  background: string
  avatar: string
  isOnline: boolean
  socketId: string
}

interface Message {
  id: string
  senderId: string
  senderNickname: string
  senderBackground: string
  content: string
  timestamp: Date
  isPrivate: boolean
  recipientId?: string
  roomId?: string
}

interface PrivateChat {
  id: string
  participants: string[]
  participantNames: string[]
  lastMessage?: Message
}

const backgroundOptions = [
  { value: "gradient-1", label: "أزرق كلاسيكي", style: "bg-gradient-to-br from-blue-500 to-blue-700" },
  { value: "gradient-2", label: "أخضر طبيعي", style: "bg-gradient-to-br from-emerald-500 to-teal-600" },
  { value: "gradient-3", label: "وردي أنيق", style: "bg-gradient-to-br from-pink-500 to-rose-600" },
  { value: "gradient-4", label: "ذهبي فاخر", style: "bg-gradient-to-br from-amber-500 to-orange-600" },
  { value: "gradient-5", label: "بنفسجي ملكي", style: "bg-gradient-to-br from-purple-500 to-indigo-600" },
  { value: "gradient-6", label: "أحمر قوي", style: "bg-gradient-to-br from-red-500 to-pink-600" },
]

interface ChatInterfaceProps {
  currentUser: User
}

export function ChatInterface({ currentUser }: ChatInterfaceProps) {
  const { users, messages, typingUsers, sendMessage, handleTyping, stopTyping, connectionStatus } = useChat()
  const [currentMessage, setCurrentMessage] = useState("")
  const [activeChat, setActiveChat] = useState<"public" | string>("public")
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    // تحديث المحادثات الخاصة عند وصول رسائل جديدة
    messages.forEach((message) => {
      if (message.isPrivate && message.roomId) {
        const existingChat = privateChats.find((chat) => chat.id === message.roomId)
        if (!existingChat && (message.senderId === currentUser.id || message.recipientId === currentUser.id)) {
          const otherUserId = message.senderId === currentUser.id ? message.recipientId : message.senderId
          const otherUser = users.find((u) => u.id === otherUserId)

          if (otherUser) {
            const newChat: PrivateChat = {
              id: message.roomId,
              participants: [currentUser.id, otherUserId],
              participantNames: [currentUser.nickname, otherUser.nickname],
              lastMessage: message,
            }
            setPrivateChats((prev) => [...prev, newChat])
          }
        } else if (existingChat) {
          setPrivateChats((prev) =>
            prev.map((chat) => (chat.id === message.roomId ? { ...chat, lastMessage: message } : chat)),
          )
        }
      }
    })
  }, [messages, users, currentUser.id, currentUser.nickname, privateChats])

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return

    const isPrivate = activeChat !== "public"
    const recipientId = isPrivate ? activeChat.split("-").find((id) => id !== currentUser.id) : undefined

    sendMessage(currentMessage, isPrivate, recipientId)
    setCurrentMessage("")
    stopTyping(isPrivate, recipientId)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value)

    const isPrivate = activeChat !== "public"
    const recipientId = isPrivate ? activeChat.split("-").find((id) => id !== currentUser.id) : undefined

    if (e.target.value.trim()) {
      handleTyping(isPrivate, recipientId)
    } else {
      stopTyping(isPrivate, recipientId)
    }
  }

  const startPrivateChat = (userId: string) => {
    const roomId = [currentUser.id, userId].sort().join("-")
    const existingChat = privateChats.find((chat) => chat.id === roomId)

    if (existingChat) {
      setActiveChat(roomId)
      return
    }

    const otherUser = users.find((u) => u.id === userId)
    if (!otherUser) return

    const newChat: PrivateChat = {
      id: roomId,
      participants: [currentUser.id, userId],
      participantNames: [currentUser.nickname, otherUser.nickname],
    }

    setPrivateChats((prev) => [...prev, newChat])
    setActiveChat(roomId)
  }

  const getFilteredMessages = () => {
    if (activeChat === "public") {
      return messages.filter((msg) => !msg.isPrivate)
    }
    return messages.filter((msg) => msg.roomId === activeChat)
  }

  const getCurrentChatName = () => {
    if (activeChat === "public") return "الدردشة العامة"

    const chat = privateChats.find((c) => c.id === activeChat)
    if (!chat) return ""

    return chat.participantNames.find((name) => name !== currentUser.nickname) || ""
  }

  const getTypingUsersForCurrentChat = () => {
    const currentChatMessages = getFilteredMessages()
    const relevantUserIds =
      activeChat === "public"
        ? users.map((u) => u.id)
        : privateChats.find((c) => c.id === activeChat)?.participants || []

    return typingUsers
      .filter((userId) => relevantUserIds.includes(userId) && userId !== currentUser.id)
      .map((userId) => users.find((u) => u.id === userId)?.nickname)
      .filter(Boolean)
  }

  const typingUsersInCurrentChat = getTypingUsersForCurrentChat()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* الشريط الجانبي المحسن */}
      <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-lg">
        {/* معلومات المستخدم الحالي */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Avatar className="w-14 h-14 ring-2 ring-white shadow-lg">
              <AvatarFallback
                className={`${backgroundOptions.find((bg) => bg.value === currentUser.background)?.style} text-white font-bold text-lg`}
              >
                {currentUser.nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-right text-lg">{currentUser.nickname}</h3>
              <div className="flex items-center space-x-2 space-x-reverse mt-1">
                {connectionStatus === "connected" ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      متصل
                    </Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                      غير متصل
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* قائمة الدردشات */}
        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <h4 className="font-bold mb-4 text-right text-gray-700 flex items-center">
              <MessageCircle className="w-5 h-5 ml-2" />
              الدردشات
            </h4>

            {/* الدردشة العامة */}
            <div
              className={`p-4 rounded-xl cursor-pointer mb-3 transition-all duration-200 ${
                activeChat === "public"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105"
                  : "hover:bg-gray-50 bg-white shadow-sm"
              }`}
              onClick={() => setActiveChat("public")}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeChat === "public" ? "bg-white/20" : "bg-gradient-to-br from-blue-500 to-purple-600"
                  }`}
                >
                  <Users className={`w-6 h-6 ${activeChat === "public" ? "text-white" : "text-white"}`} />
                </div>
                <div className="flex-1 text-right">
                  <div className="font-semibold">الدردشة العامة</div>
                  <div className={`text-sm ${activeChat === "public" ? "text-blue-100" : "text-gray-500"}`}>
                    {users.filter((u) => u.isOnline).length} متصل الآن
                  </div>
                </div>
              </div>
            </div>

            {/* المحادثات الخاصة */}
            {privateChats.map((chat) => {
              const otherUserName = chat.participantNames.find((name) => name !== currentUser.nickname)
              const otherUser = users.find((u) => u.nickname === otherUserName)
              const isActive = activeChat === chat.id

              return (
                <div
                  key={chat.id}
                  className={`p-4 rounded-xl cursor-pointer mb-3 transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105"
                      : "hover:bg-gray-50 bg-white shadow-sm"
                  }`}
                  onClick={() => setActiveChat(chat.id)}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="relative">
                      <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
                        <AvatarFallback
                          className={`${backgroundOptions.find((bg) => bg.value === otherUser?.background)?.style} text-white font-bold`}
                        >
                          {otherUserName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {otherUser?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <div className="font-semibold truncate">{otherUserName}</div>
                      {chat.lastMessage && (
                        <div className={`text-sm truncate ${isActive ? "text-purple-100" : "text-gray-500"}`}>
                          {chat.lastMessage.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator className="mx-4" />

          {/* قائمة المستخدمين */}
          <div className="p-4">
            <h4 className="font-bold mb-4 text-right text-gray-700 flex items-center">
              <Users className="w-5 h-5 ml-2" />
              المستخدمون ({users.filter((u) => u.id !== currentUser.id).length})
            </h4>
            <ScrollArea className="h-64">
              {users
                .filter((user) => user.id !== currentUser.id)
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg mb-2 transition-colors"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="relative">
                        <Avatar className="w-10 h-10 shadow-md">
                          <AvatarFallback
                            className={`${backgroundOptions.find((bg) => bg.value === user.background)?.style} text-white font-bold text-sm`}
                          >
                            {user.nickname.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${user.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                        ></div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm text-gray-800">{user.nickname}</div>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <span className={`text-xs ${user.isOnline ? "text-green-600" : "text-gray-500"}`}>
                            {user.isOnline ? "متصل الآن" : "غير متصل"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startPrivateChat(user.id)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* منطقة الدردشة الرئيسية المحسنة */}
      <div className="flex-1 flex flex-col">
        {/* رأس الدردشة المحسن */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              {activeChat !== "public" && (
                <Avatar className="w-10 h-10 shadow-md">
                  <AvatarFallback
                    className={`${backgroundOptions.find((bg) => bg.value === users.find((u) => u.nickname === getCurrentChatName())?.background)?.style} text-white font-bold`}
                  >
                    {getCurrentChatName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-800">{getCurrentChatName()}</h2>
                {typingUsersInCurrentChat.length > 0 && (
                  <div className="text-sm text-blue-600 animate-pulse">
                    {typingUsersInCurrentChat.join(", ")} يكتب...
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              {activeChat === "public" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {users.filter((u) => u.isOnline).length} متصل
                </Badge>
              )}
              <div
                className={`flex items-center space-x-2 space-x-reverse ${connectionStatus === "connected" ? "text-green-600" : "text-red-600"}`}
              >
                {connectionStatus === "connected" ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm font-medium">{connectionStatus === "connected" ? "متصل" : "غير متصل"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* منطقة الرسائل المحسنة */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {getFilteredMessages().map((message) => {
              const isOwnMessage = message.senderId === currentUser.id
              const isSystemMessage = message.senderId === "system"

              if (isSystemMessage) {
                return (
                  <div key={message.id} className="flex justify-center">
                    <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm">{message.content}</div>
                  </div>
                )
              }

              return (
                <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "order-2" : "order-1"}`}>
                    {!isOwnMessage && (
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <Avatar className="w-8 h-8 shadow-sm">
                          <AvatarFallback
                            className={`${backgroundOptions.find((bg) => bg.value === message.senderBackground)?.style} text-white font-bold text-xs`}
                          >
                            {message.senderNickname.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold text-gray-700">{message.senderNickname}</span>
                      </div>
                    )}
                    <div
                      className={`px-6 py-3 rounded-2xl shadow-sm ${
                        isOwnMessage
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                          : "bg-white text-gray-800 border border-gray-100"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* منطقة إدخال الرسالة المحسنة */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-6">
          <div className="flex space-x-3 space-x-reverse">
            <Input
              ref={inputRef}
              placeholder={`اكتب رسالة في ${getCurrentChatName()}...`}
              value={currentMessage}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 rounded-full border-gray-200 focus:border-blue-500 focus:ring-blue-500 px-6 py-3 text-right"
              disabled={connectionStatus !== "connected"}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || connectionStatus !== "connected"}
              className="rounded-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          {connectionStatus !== "connected" && (
            <div className="text-center text-red-500 text-sm mt-2">فقدان الاتصال... جاري إعادة المحاولة</div>
          )}
        </div>
      </div>
    </div>
  )
}
