import { type NextRequest, NextResponse } from "next/server"
import { chatStore } from "@/lib/chat-store"

export async function GET() {
  try {
    const users = await chatStore.getUsers()
    return NextResponse.json({ users })
  } catch (error) {
    console.error("خطأ في جلب المستخدمين:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user } = body

    if (!user?.id || !user?.nickname) {
      return NextResponse.json({ error: "بيانات المستخدم غير مكتملة" }, { status: 400 })
    }

    await chatStore.addUser(user)

    // إضافة رسالة انضمام
    await chatStore.addMessage({
      senderId: "system",
      senderNickname: "النظام",
      senderBackground: "gradient-1",
      content: `${user.nickname} انضم إلى الدردشة 🎉`,
      isPrivate: false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("خطأ في إضافة المستخدم:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const nickname = searchParams.get("nickname")

    if (!userId) {
      return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 })
    }

    await chatStore.removeUser(userId)

    // إضافة رسالة مغادرة
    if (nickname) {
      await chatStore.addMessage({
        senderId: "system",
        senderNickname: "النظام",
        senderBackground: "gradient-1",
        content: `${nickname} غادر الدردشة 👋`,
        isPrivate: false,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("خطأ في إزالة المستخدم:", error)
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 })
  }
}
