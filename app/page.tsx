"use client"

import { useState } from "react"

interface Message {
  id: string
  nickname: string
  content: string
  timestamp: Date
}

export default function Home() {
  const [nickname, setNickname] = useState("")
  const [isRegistered, setIsRegistered] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState("")

  const handleRegister = () => {
    if (nickname.trim()) {
      setIsRegistered(true)
      setMessages([
        {
          id: "1",
          nickname: "النظام",
          content: `${nickname} انضم إلى الدردشة 🎉`,
          timestamp: new Date(),
        },
      ])
    }
  }

  const handleSendMessage = () => {
    if (currentMessage.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        nickname: nickname,
        content: currentMessage,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
      setCurrentMessage("")
    }
  }

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f0f9ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    },
    card: {
      backgroundColor: "white",
      padding: "2rem",
      borderRadius: "0.5rem",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      width: "100%",
      maxWidth: "28rem",
    },
    title: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      textAlign: "center" as const,
      marginBottom: "1.5rem",
      color: "#1f2937",
    },
    input: {
      width: "100%",
      padding: "0.75rem",
      border: "1px solid #d1d5db",
      borderRadius: "0.375rem",
      textAlign: "right" as const,
      marginBottom: "1rem",
      fontSize: "1rem",
    },
    button: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "0.375rem",
      fontSize: "1rem",
      cursor: "pointer",
    },
    chatContainer: {
      minHeight: "100vh",
      backgroundColor: "#f9fafb",
      display: "flex",
      flexDirection: "column" as const,
    },
    header: {
      backgroundColor: "white",
      padding: "1rem",
      borderBottom: "1px solid #e5e7eb",
      textAlign: "right" as const,
    },
    messagesArea: {
      flex: 1,
      padding: "1rem",
      overflowY: "auto" as const,
    },
    message: {
      backgroundColor: "white",
      padding: "1rem",
      borderRadius: "0.5rem",
      marginBottom: "1rem",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    },
    messageHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "0.5rem",
    },
    nickname: {
      fontWeight: "bold",
      color: "#3b82f6",
    },
    timestamp: {
      fontSize: "0.75rem",
      color: "#6b7280",
    },
    inputArea: {
      backgroundColor: "white",
      padding: "1rem",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      gap: "0.5rem",
    },
    messageInput: {
      flex: 1,
      padding: "0.75rem",
      border: "1px solid #d1d5db",
      borderRadius: "0.375rem",
      textAlign: "right" as const,
    },
    sendButton: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "0.375rem",
      cursor: "pointer",
    },
  }

  if (!isRegistered) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>مرحباً بك في الدردشة</h1>
          <input
            type="text"
            placeholder="أدخل اسمك المستعار"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={styles.input}
            onKeyPress={(e) => e.key === "Enter" && handleRegister()}
          />
          <button
            onClick={handleRegister}
            disabled={!nickname.trim()}
            style={{
              ...styles.button,
              backgroundColor: !nickname.trim() ? "#9ca3af" : "#3b82f6",
              cursor: !nickname.trim() ? "not-allowed" : "pointer",
            }}
          >
            دخول الدردشة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.chatContainer}>
      <div style={styles.header}>
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold" }}>الدردشة العامة</h1>
        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#6b7280" }}>مرحباً {nickname}</p>
      </div>

      <div style={styles.messagesArea}>
        {messages.map((message) => (
          <div key={message.id} style={styles.message}>
            <div style={styles.messageHeader}>
              <span style={styles.timestamp}>{message.timestamp.toLocaleTimeString("ar-SA")}</span>
              <span style={styles.nickname}>{message.nickname}</span>
            </div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="اكتب رسالتك..."
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          style={styles.messageInput}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button
          onClick={handleSendMessage}
          disabled={!currentMessage.trim()}
          style={{
            ...styles.sendButton,
            backgroundColor: !currentMessage.trim() ? "#9ca3af" : "#3b82f6",
            cursor: !currentMessage.trim() ? "not-allowed" : "pointer",
          }}
        >
          إرسال
        </button>
      </div>
    </div>
  )
}
