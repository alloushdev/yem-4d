import { type NextRequest, NextResponse } from "next/server"
import { chatStore } from "@/lib/chat-store"

export async function GET() {
  try {
    const typingUsers = chatStore.getTypingUsers()
    return NextResponse.json({ typingUsers })
  } catch (error) {
    console.error("خطأ في جلب المستخدمين الذين يكتبون:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, nickname, isTyping } = body

    if (!userId || !nickname) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 })
    }

    if (isTyping) {
      chatStore.setUserTyping(userId, nickname)
    } else {
      chatStore.removeUserTyping(userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("خطأ في تحديث حالة الكتابة:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}
