"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { User, Message, TypingUser } from "@/lib/chat-store"

export function useChat() {
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")

  const lastMessageTime = useRef<Date>(new Date())
  const currentUser = useRef<User | null>(null)
  const typingTimeout = useRef<NodeJS.Timeout>()
  const pollInterval = useRef<NodeJS.Timeout>()

  // جلب الرسائل الجديدة
  const fetchMessages = useCallback(async (isPrivate = false, recipientId?: string) => {
    try {
      const params = new URLSearchParams({
        since: lastMessageTime.current.toISOString(),
      })

      if (isPrivate && recipientId && currentUser.current) {
        params.append("userId1", currentUser.current.id)
        params.append("userId2", recipientId)
      }

      const response = await fetch(`/api/chat/messages?${params}`)
      const data = await response.json()

      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const newMessages = data.messages.filter(
            (msg: Message) => !prev.some((existingMsg) => existingMsg.id === msg.id),
          )

          if (newMessages.length > 0) {
            lastMessageTime.current = new Date(
              Math.max(...newMessages.map((msg: Message) => new Date(msg.timestamp).getTime())),
            )
          }

          return [...prev, ...newMessages].slice(-100) // الاحتفاظ بآخر 100 رسالة
        })
      }

      setIsConnected(true)
      setConnectionStatus("connected")
    } catch (error) {
      console.error("خطأ في جلب الرسائل:", error)
      setIsConnected(false)
      setConnectionStatus("disconnected")
    }
  }, [])

  // جلب المستخدمين
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/users")
      const data = await response.json()

      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("خطأ في جلب المستخدمين:", error)
    }
  }, [])

  // جلب المستخدمين الذين يكتبون
  const fetchTypingUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/typing")
      const data = await response.json()

      if (data.typingUsers) {
        setTypingUsers(data.typingUsers.filter((user: TypingUser) => user.userId !== currentUser.current?.id))
      }
    } catch (error) {
      console.error("خطأ في جلب المستخدمين الذين يكتبون:", error)
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
            setMessages(messagesData.messages)
            if (messagesData.messages.length > 0) {
              lastMessageTime.current = new Date(
                Math.max(...messagesData.messages.map((msg: Message) => new Date(msg.timestamp).getTime())),
              )
            }
          }

          // بدء الاستطلاع الدوري
          pollInterval.current = setInterval(() => {
            fetchMessages()
            fetchUsers()
            fetchTypingUsers()
          }, 2000) // كل ثانيتين

          setIsConnected(true)
          setConnectionStatus("connected")
        }
      } catch (error) {
        console.error("خطأ في الانضمام للدردشة:", error)
        setConnectionStatus("disconnected")
      }
    },
    [fetchMessages, fetchUsers, fetchTypingUsers],
  )

  // إرسال رسالة
  const sendMessage = useCallback(
    async (content: string, isPrivate = false, recipientId?: string) => {
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

        if (response.ok) {
          // جلب الرسائل الجديدة فوراً
          setTimeout(() => fetchMessages(isPrivate, recipientId), 100)
        }
      } catch (error) {
        console.error("خطأ في إرسال الرسالة:", error)
      }
    },
    [fetchMessages],
  )

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
      if (pollInterval.current) {
        clearInterval(pollInterval.current)
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current)
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
  }
}
