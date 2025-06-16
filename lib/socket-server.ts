import type { Server as NetServer } from "http"
import type { NextApiResponse } from "next"
import { Server as SocketIOServer } from "socket.io"

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

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

const users: Map<string, User> = new Map()
const messages: Message[] = []

export const initSocket = (server: NetServer) => {
  const io = new SocketIOServer(server, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("مستخدم متصل:", socket.id)

    socket.on("user-join", (userData: Omit<User, "socketId" | "isOnline">) => {
      const user: User = {
        ...userData,
        socketId: socket.id,
        isOnline: true,
      }

      users.set(socket.id, user)

      // إرسال قائمة المستخدمين المحدثة
      io.emit("users-update", Array.from(users.values()))

      // إرسال الرسائل السابقة للمستخدم الجديد
      socket.emit("previous-messages", messages.slice(-50))

      // إشعار انضمام المستخدم
      const joinMessage: Message = {
        id: Date.now().toString(),
        senderId: "system",
        senderNickname: "النظام",
        senderBackground: "gradient-1",
        content: `${userData.nickname} انضم إلى الدردشة 🎉`,
        timestamp: new Date(),
        isPrivate: false,
      }

      messages.push(joinMessage)
      io.emit("new-message", joinMessage)
    })

    socket.on(
      "send-message",
      (messageData: {
        content: string
        isPrivate: boolean
        recipientId?: string
      }) => {
        const user = users.get(socket.id)
        if (!user) return

        const message: Message = {
          id: Date.now().toString(),
          senderId: user.id,
          senderNickname: user.nickname,
          senderBackground: user.background,
          content: messageData.content,
          timestamp: new Date(),
          isPrivate: messageData.isPrivate,
          recipientId: messageData.recipientId,
          roomId: messageData.isPrivate ? [user.id, messageData.recipientId].sort().join("-") : "public",
        }

        messages.push(message)

        if (messageData.isPrivate && messageData.recipientId) {
          const recipientUser = Array.from(users.values()).find((u) => u.id === messageData.recipientId)
          if (recipientUser) {
            io.to(recipientUser.socketId).emit("new-message", message)
            socket.emit("new-message", message)
          }
        } else {
          io.emit("new-message", message)
        }
      },
    )

    socket.on("start-typing", (data: { isPrivate: boolean; recipientId?: string }) => {
      const user = users.get(socket.id)
      if (!user) return

      if (data.isPrivate && data.recipientId) {
        const recipientUser = Array.from(users.values()).find((u) => u.id === data.recipientId)
        if (recipientUser) {
          io.to(recipientUser.socketId).emit("user-typing", {
            userId: user.id,
            nickname: user.nickname,
          })
        }
      } else {
        socket.broadcast.emit("user-typing", {
          userId: user.id,
          nickname: user.nickname,
        })
      }
    })

    socket.on("stop-typing", (data: { isPrivate: boolean; recipientId?: string }) => {
      const user = users.get(socket.id)
      if (!user) return

      if (data.isPrivate && data.recipientId) {
        const recipientUser = Array.from(users.values()).find((u) => u.id === data.recipientId)
        if (recipientUser) {
          io.to(recipientUser.socketId).emit("user-stopped-typing", user.id)
        }
      } else {
        socket.broadcast.emit("user-stopped-typing", user.id)
      }
    })

    socket.on("disconnect", () => {
      const user = users.get(socket.id)
      if (user) {
        users.delete(socket.id)

        const leaveMessage: Message = {
          id: Date.now().toString(),
          senderId: "system",
          senderNickname: "النظام",
          senderBackground: "gradient-1",
          content: `${user.nickname} غادر الدردشة 👋`,
          timestamp: new Date(),
          isPrivate: false,
        }

        messages.push(leaveMessage)
        io.emit("new-message", leaveMessage)
        io.emit("users-update", Array.from(users.values()))
      }

      console.log("مستخدم منقطع:", socket.id)
    })
  })

  return io
}
