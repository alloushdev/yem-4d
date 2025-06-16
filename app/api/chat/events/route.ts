import type { NextRequest } from "next/server"
import { chatStore } from "@/lib/chat-store"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return new Response("User ID required", { status: 400 })
  }

  // إنشاء اتصال Server-Sent Events
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // إرسال رسالة اتصال أولية
      const data = `data: ${JSON.stringify({ type: "connected", timestamp: new Date() })}\n\n`
      controller.enqueue(encoder.encode(data))

      // تحديث نشاط المستخدم
      chatStore.updateUserActivity(userId)

      // إرسال تحديثات دورية
      const interval = setInterval(async () => {
        try {
          // جلب الرسائل الجديدة
          const messages = await chatStore.getMessages(new Date(Date.now() - 5000)) // آخر 5 ثوان
          if (messages.length > 0) {
            const data = `data: ${JSON.stringify({ type: "messages", data: messages })}\n\n`
            controller.enqueue(encoder.encode(data))
          }

          // جلب المستخدمين المتصلين
          const users = await chatStore.getUsers()
          const userData = `data: ${JSON.stringify({ type: "users", data: users })}\n\n`
          controller.enqueue(encoder.encode(userData))

          // جلب المستخدمين الذين يكتبون
          const typingUsers = await chatStore.getTypingUsers()
          const typingData = `data: ${JSON.stringify({ type: "typing", data: typingUsers })}\n\n`
          controller.enqueue(encoder.encode(typingData))

          // تحديث نشاط المستخدم
          await chatStore.updateUserActivity(userId)
        } catch (error) {
          console.error("خطأ في إرسال البيانات:", error)
        }
      }, 2000) // كل ثانيتين

      // تنظيف عند إغلاق الاتصال
      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}
