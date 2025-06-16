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
  private users: Map<string, User> = new Map()
  private messages: Message[] = []
  private typingUsers: Map<string, TypingUser> = new Map()

  // إدارة المستخدمين
  addUser(user: User): void {
    this.users.set(user.id, { ...user, isOnline: true, lastSeen: new Date() })
  }

  removeUser(userId: string): void {
    const user = this.users.get(userId)
    if (user) {
      this.users.set(userId, { ...user, isOnline: false, lastSeen: new Date() })
    }
  }

  getUsers(): User[] {
    return Array.from(this.users.values())
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId)
  }

  updateUserActivity(userId: string): void {
    const user = this.users.get(userId)
    if (user) {
      this.users.set(userId, { ...user, lastSeen: new Date() })
    }
  }

  // إدارة الرسائل
  addMessage(message: Omit<Message, "id" | "timestamp">): Message {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    }

    this.messages.push(newMessage)

    // الاحتفاظ بآخر 1000 رسالة فقط
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000)
    }

    return newMessage
  }

  getMessages(since?: Date): Message[] {
    if (since) {
      return this.messages.filter((msg) => msg.timestamp > since)
    }
    return this.messages.slice(-50) // آخر 50 رسالة
  }

  getPrivateMessages(userId1: string, userId2: string, since?: Date): Message[] {
    const roomId = [userId1, userId2].sort().join("-")
    let messages = this.messages.filter((msg) => msg.roomId === roomId)

    if (since) {
      messages = messages.filter((msg) => msg.timestamp > since)
    }

    return messages.slice(-50)
  }

  // إدارة الكتابة
  setUserTyping(userId: string, nickname: string): void {
    this.typingUsers.set(userId, {
      userId,
      nickname,
      timestamp: new Date(),
    })

    // إزالة حالة الكتابة بعد 3 ثوان
    setTimeout(() => {
      this.typingUsers.delete(userId)
    }, 3000)
  }

  removeUserTyping(userId: string): void {
    this.typingUsers.delete(userId)
  }

  getTypingUsers(): TypingUser[] {
    const now = new Date()
    // إزالة المستخدمين الذين توقفوا عن الكتابة منذ أكثر من 3 ثوان
    for (const [userId, typingUser] of this.typingUsers.entries()) {
      if (now.getTime() - typingUser.timestamp.getTime() > 3000) {
        this.typingUsers.delete(userId)
      }
    }
    return Array.from(this.typingUsers.values())
  }

  // تنظيف البيانات القديمة
  cleanup(): void {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    // وضع علامة غير متصل للمستخدمين الذين لم يكونوا نشطين لأكثر من 5 دقائق
    for (const [userId, user] of this.users.entries()) {
      if (user.isOnline && user.lastSeen < fiveMinutesAgo) {
        this.users.set(userId, { ...user, isOnline: false })
      }
    }

    // إزالة حالات الكتابة القديمة
    for (const [userId, typingUser] of this.typingUsers.entries()) {
      if (now.getTime() - typingUser.timestamp.getTime() > 3000) {
        this.typingUsers.delete(userId)
      }
    }
  }
}

export const chatStore = new ChatStore()

// تنظيف دوري كل دقيقة
setInterval(() => {
  chatStore.cleanup()
}, 60000)

export type { User, Message, TypingUser }
