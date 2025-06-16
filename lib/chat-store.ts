import { supabaseAdmin } from "./supabase"

interface User {
  id: string
  nickname: string
  background: string
  avatar: string
  isOnline: boolean
  lastSeen: Date
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

interface TypingUser {
  userId: string
  nickname: string
  timestamp: Date
}

class ChatStore {
  // إدارة المستخدمين
  async addUser(user: User): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from("users").upsert({
        id: user.id,
        nickname: user.nickname,
        background: user.background,
        avatar: user.avatar,
        is_online: true,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("خطأ في إضافة المستخدم:", error)
      }
    } catch (error) {
      console.error("خطأ في إضافة المستخدم:", error)
    }
  }

  async removeUser(userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from("users")
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        console.error("خطأ في إزالة المستخدم:", error)
      }
    } catch (error) {
      console.error("خطأ في إزالة المستخدم:", error)
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabaseAdmin.from("users").select("*").order("last_seen", { ascending: false })

      if (error) {
        console.error("خطأ في جلب المستخدمين:", error)
        return []
      }

      return data.map((user) => ({
        id: user.id,
        nickname: user.nickname,
        background: user.background,
        avatar: user.avatar,
        isOnline: user.is_online,
        lastSeen: new Date(user.last_seen),
      }))
    } catch (error) {
      console.error("خطأ في جلب المستخدمين:", error)
      return []
    }
  }

  async updateUserActivity(userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from("users")
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        console.error("خطأ في تحديث نشاط المستخدم:", error)
      }
    } catch (error) {
      console.error("خطأ في تحديث نشاط المستخدم:", error)
    }
  }

  // إدارة الرسائل
  async addMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message | null> {
    try {
      const newMessage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        sender_id: message.senderId,
        sender_nickname: message.senderNickname,
        sender_background: message.senderBackground,
        content: message.content,
        is_private: message.isPrivate,
        recipient_id: message.recipientId,
        room_id: message.roomId,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabaseAdmin.from("messages").insert(newMessage).select().single()

      if (error) {
        console.error("خطأ في إضافة الرسالة:", error)
        return null
      }

      return {
        id: data.id,
        senderId: data.sender_id,
        senderNickname: data.sender_nickname,
        senderBackground: data.sender_background,
        content: data.content,
        timestamp: new Date(data.created_at),
        isPrivate: data.is_private,
        recipientId: data.recipient_id,
        roomId: data.room_id,
      }
    } catch (error) {
      console.error("خطأ في إضافة الرسالة:", error)
      return null
    }
  }

  async getMessages(since?: Date): Promise<Message[]> {
    try {
      let query = supabaseAdmin.from("messages").select("*").order("created_at", { ascending: true }).limit(100)

      if (since) {
        query = query.gt("created_at", since.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error("خطأ في جلب الرسائل:", error)
        return []
      }

      return data.map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderNickname: msg.sender_nickname,
        senderBackground: msg.sender_background,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isPrivate: msg.is_private,
        recipientId: msg.recipient_id,
        roomId: msg.room_id,
      }))
    } catch (error) {
      console.error("خطأ في جلب الرسائل:", error)
      return []
    }
  }

  async getPrivateMessages(userId1: string, userId2: string, since?: Date): Promise<Message[]> {
    try {
      const roomId = [userId1, userId2].sort().join("-")

      let query = supabaseAdmin
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(50)

      if (since) {
        query = query.gt("created_at", since.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error("خطأ في جلب الرسائل الخاصة:", error)
        return []
      }

      return data.map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderNickname: msg.sender_nickname,
        senderBackground: msg.sender_background,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isPrivate: msg.is_private,
        recipientId: msg.recipient_id,
        roomId: msg.room_id,
      }))
    } catch (error) {
      console.error("خطأ في جلب الرسائل الخاصة:", error)
      return []
    }
  }

  // إدارة الكتابة
  async setUserTyping(userId: string, nickname: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.from("typing_status").upsert({
        user_id: userId,
        nickname: nickname,
        is_typing: true,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("خطأ في تحديث حالة الكتابة:", error)
      }
    } catch (error) {
      console.error("خطأ في تحديث حالة الكتابة:", error)
    }
  }

  async removeUserTyping(userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from("typing_status")
        .update({
          is_typing: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (error) {
        console.error("خطأ في إزالة حالة الكتابة:", error)
      }
    } catch (error) {
      console.error("خطأ في إزالة حالة الكتابة:", error)
    }
  }

  async getTypingUsers(): Promise<TypingUser[]> {
    try {
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()

      const { data, error } = await supabaseAdmin
        .from("typing_status")
        .select("*")
        .eq("is_typing", true)
        .gt("updated_at", fiveSecondsAgo)

      if (error) {
        console.error("خطأ في جلب المستخدمين الذين يكتبون:", error)
        return []
      }

      return data.map((user) => ({
        userId: user.user_id,
        nickname: user.nickname,
        timestamp: new Date(user.updated_at),
      }))
    } catch (error) {
      console.error("خطأ في جلب المستخدمين الذين يكتبون:", error)
      return []
    }
  }

  // تنظيف البيانات القديمة
  async cleanup(): Promise<void> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      // وضع علامة غير متصل للمستخدمين غير النشطين
      await supabaseAdmin
        .from("users")
        .update({ is_online: false })
        .eq("is_online", true)
        .lt("last_seen", fiveMinutesAgo)

      // إزالة حالات الكتابة القديمة
      await supabaseAdmin
        .from("typing_status")
        .update({ is_typing: false })
        .eq("is_typing", true)
        .lt("updated_at", new Date(Date.now() - 10000).toISOString()) // 10 ثوان
    } catch (error) {
      console.error("خطأ في تنظيف البيانات:", error)
    }
  }
}

export const chatStore = new ChatStore()

// تنظيف دوري كل دقيقة
if (typeof window === "undefined") {
  setInterval(() => {
    chatStore.cleanup()
  }, 60000)
}

export type { User, Message, TypingUser }
