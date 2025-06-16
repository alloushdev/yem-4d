import { type NextRequest, NextResponse } from "next/server"
import { chatStore } from "@/lib/chat-store"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get("since")
    const userId1 = searchParams.get("userId1")
    const userId2 = searchParams.get("userId2")

    let messages

    if (userId1 && userId2) {
      // رسائل خاصة
      messages = chatStore.getPrivateMessages(userId1, userId2, since ? new Date(since) : undefined)
    } else {
      // رسائل عامة
      messages = chatStore.getMessages(since ? new Date(since) : undefined).filter((msg) => !msg.isPrivate)
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("خطأ في جلب الرسائل:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, senderNickname, senderBackground, content, isPrivate, recipientId } = body

    if (!senderId || !senderNickname || !content?.trim()) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 })
    }

    // تحديث نشاط المستخدم
    chatStore.updateUserActivity(senderId)

    const message = chatStore.addMessage({
      senderId,
      senderNickname,
      senderBackground,
      content: content.trim(),
      isPrivate: isPrivate || false,
      recipientId,
      roomId: isPrivate && recipientId ? [senderId, recipientId].sort().join("-") : "public",
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error("خطأ في إرسال الرسالة:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}
