"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

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

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // تهيئة Socket.IO server أولاً
        await fetch("/api/socketio")

        // إنشاء اتصال Socket.IO
        const socketInstance = io({
          path: "/api/socketio",
          transports: ["websocket", "polling"],
        })

        socketInstance.on("connect", () => {
          console.log("🔌 متصل بالخادم:", socketInstance.id)
          setIsConnected(true)
          setConnectionStatus("connected")
          setSocket(socketInstance)
        })

        socketInstance.on("disconnect", () => {
          console.log("❌ انقطع الاتصال")
          setIsConnected(false)
          setConnectionStatus("disconnected")
        })

        socketInstance.on("connect_error", (error) => {
          console.error("❌ خطأ في الاتصال:", error)
          setConnectionStatus("disconnected")
        })

        socketInstance.on("users-update", (updatedUsers: User[]) => {
          console.log("👥 تحديث المستخدمين:", updatedUsers.length)
          setUsers(updatedUsers)
        })

        socketInstance.on("new-message", (message: Message) => {
          console.log("💬 رسالة جديدة:", message.content)
          setMessages((prev) => [
            ...prev,
            {
              ...message,
              timestamp: new Date(message.timestamp),
            },
          ])
        })

        socketInstance.on("previous-messages", (previousMessages: Message[]) => {
          console.log("📜 الرسائل السابقة:", previousMessages.length)
          setMessages(
            previousMessages.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          )
        })

        socketInstance.on("user-typing", ({ userId, nickname }: { userId: string; nickname: string }) => {
          setTypingUsers((prev) => [...prev.filter((id) => id !== userId), userId])
        })

        socketInstance.on("user-stopped-typing", (userId: string) => {
          setTypingUsers((prev) => prev.filter((id) => id !== userId))
        })

        return () => {
          socketInstance.disconnect()
        }
      } catch (error) {
        console.error("❌ خطأ في تهيئة Socket:", error)
        setConnectionStatus("disconnected")
      }
    }

    initializeSocket()
  }, [])

  const joinChat = (userData: Omit<User, "socketId" | "isOnline">) => {
    if (socket && isConnected) {
      console.log("🚀 انضمام للدردشة:", userData.nickname)
      socket.emit("user-join", userData)
    } else {
      console.log("⚠️ Socket غير متصل")
    }
  }

  const sendMessage = (content: string, isPrivate = false, recipientId?: string) => {
    if (socket && content.trim() && isConnected) {
      console.log("📤 إرسال رسالة:", content)
      socket.emit("send-message", {
        content: content.trim(),
        isPrivate,
        recipientId,
      })
    }
  }

  const startTyping = (isPrivate = false, recipientId?: string) => {
    if (socket && isConnected) {
      socket.emit("start-typing", { isPrivate, recipientId })
    }
  }

  const stopTyping = (isPrivate = false, recipientId?: string) => {
    if (socket && isConnected) {
      socket.emit("stop-typing", { isPrivate, recipientId })
    }
  }

  const handleTyping = (isPrivate = false, recipientId?: string) => {
    startTyping(isPrivate, recipientId)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(isPrivate, recipientId)
    }, 1000)
  }

  return {
    socket,
    isConnected,
    connectionStatus,
    users,
    messages,
    typingUsers,
    joinChat,
    sendMessage,
    handleTyping,
    stopTyping,
  }
}
