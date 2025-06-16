"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { User, Message, TypingUser } from "@/lib/chat-store"

export function useRealtimeChat() {
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")

  const currentUser = useRef<User | null>(null)
  const eventSource = useRef<EventSource | null>(null)
  const typingTimeout = useRef<NodeJS.Timeout>()
  const reconnectTimeout = useRef<NodeJS.Timeout>()

  // إنشاء اتصال SSE
  const connectToEvents = useCallback(() => {
    if (!currentUser.current) return

    try {
      setConnectionStatus("connecting")

      // إغلاق الاتصال السابق إن وجد
      if (eventSource.current) {
        eventSource.current.close()
      }

      // إنشاء اتصال جديد
      eventSource.current = new EventSource(`/api/chat/events?userId=${currentUser.current.id}`)

      eventSource.current.onopen = () => {
        console.log("🔌 اتصال SSE تم بنجاح")
        setIsConnected(true)
        setConnectionStatus("connected")

        // إلغاء محاولة إعادة الاتصال
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current)
        }
      }

      eventSource.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case "connected":
              console.log("✅ تم الاتصال بالخادم")
              break

            case "messages":
              if (data.data && data.data.length > 0) {
                setMessages((prev) => {
                  const newMessages = data.data.filter(
                    (msg: Message) => !prev.some((existingMsg) => existingMsg.id === msg.id),
                  )
                  return [
                    ...prev,
                    ...newMessages.map((msg: Message) => ({
                      ...msg,
                      timestamp: new Date(msg.timestamp),
                    })),
                  ].slice(-100) // الاحتفاظ بآخر 100 رسالة
                })
              }
              break

            case "users":
              if (data.data) {
                setUsers(
                  data.data.map((user: User) => ({
                    ...user,
                    lastSeen: new Date(user.lastSeen),
                  })),
                )
              }
              break

            case "typing":
              if (data.data) {
                setTypingUsers(data.data.filter((user: TypingUser) => user.userId !== currentUser.current?.id))
              }
              break
          }
        } catch (error) {
          console.error("خطأ في معالجة البيانات:", error)
        }
      }

      eventSource.current.onerror = (error) => {
        console.error("❌ خطأ في اتصال SSE:", error)
        setIsConnected(false)
        setConnectionStatus("disconnected")

        // محاولة إعادة الاتصال بعد 3 ثوان
        reconnectTimeout.current = setTimeout(() => {
          console.log("🔄 محاولة إعادة الاتصال...")
          connectToEvents()
        }, 3000)
      }
    } catch (error) {
      console.error("خطأ في إنشاء اتصال SSE:", error)
      setConnectionStatus("disconnected")
    }
  }, [])

  // انضمام للدردشة
  const joinChat = useCallback(
    async (user: User) => {
      try {
        currentUser.current = user

        const response = await fetch("/api/chat/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user }),
        })

        if (response.ok) {
          // جلب الرسائل الأولية
          const messagesResponse = await fetch("/api/chat/messages")
          const messagesData = await messagesResponse.json()

          if (messagesData.messages) {
            setMessages(
              messagesData.messages.map((msg: Message) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              })),
            )
          }

          // بدء اتصال SSE
          connectToEvents()
        }
      } catch (error) {
        console.error("خطأ في الانضمام للدردشة:", error)
        setConnectionStatus("disconnected")
      }
    },
    [connectToEvents],
  )

  // إرسال رسالة
  const sendMessage = useCallback(async (content: string, isPrivate = false, recipientId?: string) => {
    if (!currentUser.current || !content.trim()) return

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.current.id,
          senderNickname: currentUser.current.nickname,
          senderBackground: currentUser.current.background,
          content: content.trim(),
          isPrivate,
          recipientId,
        }),
      })

      if (!response.ok) {
        throw new Error("فشل في إرسال الرسالة")
      }
    } catch (error) {
      console.error("خطأ في إرسال الرسالة:", error)
    }
  }, [])

  // إدارة حالة الكتابة
  const handleTyping = useCallback(async () => {
    if (!currentUser.current) return

    try {
      await fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.current.id,
          nickname: currentUser.current.nickname,
          isTyping: true,
        }),
      })

      // إيقاف حالة الكتابة بعد ثانيتين
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current)
      }

      typingTimeout.current = setTimeout(async () => {
        if (currentUser.current) {
          await fetch("/api/chat/typing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.current.id,
              nickname: currentUser.current.nickname,
              isTyping: false,
            }),
          })
        }
      }, 2000)
    } catch (error) {
      console.error("خطأ في تحديث حالة الكتابة:", error)
    }
  }, [])

  const stopTyping = useCallback(async () => {
    if (!currentUser.current) return

    try {
      await fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.current.id,
          nickname: currentUser.current.nickname,
          isTyping: false,
        }),
      })
    } catch (error) {
      console.error("خطأ في إيقاف حالة الكتابة:", error)
    }
  }, [])

  // تنظيف عند إلغاء التحميل
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser.current) {
        await fetch(`/api/chat/users?userId=${currentUser.current.id}&nickname=${currentUser.current.nickname}`, {
          method: "DELETE",
        })
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)

      if (eventSource.current) {
        eventSource.current.close()
      }

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current)
      }

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }

      handleBeforeUnload()
    }
  }, [])

  return {
    users,
    messages,
    typingUsers,
    isConnected,
    connectionStatus,
    joinChat,
    sendMessage,
    handleTyping,
    stopTyping,
  }
}
