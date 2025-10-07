/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react"
import { useState, useEffect } from "react"
import TelephonicCall from "./TelephonicCall"
import ConnectionStatus from "./ConnectionStatus"
import { AlertCircle, Phone } from "lucide-react"
import { aiResponseService } from "../services/aiResponse"
import type { WebSocketConnectionStatus } from "../types/websocket"

const avatarImage = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop"

export default function Hero() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "call">("idle")
  const [lastError, setLastError] = useState<string | null>(null)
  const [wsConnectionStatus, setWsConnectionStatus] = useState<WebSocketConnectionStatus>("disconnected")

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        await aiResponseService.connect()
        setWsConnectionStatus("connected")
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error)
        setWsConnectionStatus("error")
      }
    }

    initializeConnection()

    return () => {
      aiResponseService.disconnect()
    }
  }, [])

  // Remove the automatic greeting - it will be handled in the TelephonicCall component

  async function handleStartCall(e?: React.FormEvent) {
    e?.preventDefault()
    setLastError(null)

    if (!name.trim() || !email.trim()) {
      setLastError("Please provide name & business email before starting the call.")
      return
    }

    if (wsConnectionStatus !== "connected") {
      setLastError("Not connected to AI service. Please try again.")
      return
    }

    setStatus("call")
  }




  function handleEndCall() {
    setStatus("idle")
    setLastError(null)
    aiResponseService.clearResponse()
  }


  return (
    <section className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center py-12 lg:py-20">
      {/* Left content */}
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-purple-700 bg-clip-text text-transparent">
              Hi, I'm Rebecca.
            </span>
          </h2>
          <p className="text-2xl lg:text-3xl font-semibold text-slate-900">Find out if TalktoAI is right for you</p>
          <p className="text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl">
            Share your use case, and I'll provide quick, accurate responses so you can get the details without digging
            around.
          </p>
        </div>

        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <ConnectionStatus status={wsConnectionStatus} />
          </div>

          {status === "idle" && (
            <div className="space-y-4">
              <form onSubmit={handleStartCall} className="space-y-4">
                <div className="flex gap-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Business Email"
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="submit"
                    aria-label="Start conversation"
                    className="rounded-full bg-green-600 p-4 text-white hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={wsConnectionStatus !== "connected"}
                  >
                    <Phone className="h-5 w-5" />
                  </button>
                </div>
                {lastError && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{lastError}</span>
                  </div>
                )}
              </form>
              
              {/* Connection Status */}
              {wsConnectionStatus === "connected" && (
                <div className="rounded-lg border border-green-200 p-4 bg-green-50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700">Connected! Ready to start conversation.</span>
                  </div>
                </div>
              )}
            </div>
          )}


          {status === "call" && (
            <TelephonicCall 
              name={name} 
              email={email} 
              onEndCall={handleEndCall} 
            />
          )}
        </div>
      </div>

      <div className="flex justify-center lg:justify-end">
        <div className="relative rounded-3xl overflow-hidden w-full max-w-md lg:max-w-lg aspect-[1/1] shadow-2xl">
          <img
            src={avatarImage || "/placeholder.svg"}
            alt="Rebecca - AI Assistant"
            className="object-cover w-full h-full"
          />
        </div>
      </div>
    </section>
  )
}
