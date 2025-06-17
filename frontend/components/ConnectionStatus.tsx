"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { useSocket } from "@/hooks/useSocket"
import { apiClient } from "@/lib/api"
import { Wifi, WifiOff, Server, ServerOff } from "lucide-react"

export function ConnectionStatus() {
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "checking">("checking")
  const [socketStatus, setSocketStatus] = useState<"connected" | "disconnected">("disconnected")
  const { socket } = useSocket()

  // Check API connection
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        await apiClient.healthCheck()
        setApiStatus("connected")
      } catch (error) {
        console.error("API health check failed:", error)
        setApiStatus("disconnected")
      }
    }

    checkApiConnection()
    const interval = setInterval(checkApiConnection, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Monitor socket connection
  useEffect(() => {
    if (socket) {
      const handleConnect = () => setSocketStatus("connected")
      const handleDisconnect = () => setSocketStatus("disconnected")

      socket.on("connect", handleConnect)
      socket.on("disconnect", handleDisconnect)

      // Set initial status
      setSocketStatus(socket.connected ? "connected" : "disconnected")

      return () => {
        socket.off("connect", handleConnect)
        socket.off("disconnect", handleDisconnect)
      }
    }
  }, [socket])

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={apiStatus === "connected" ? "default" : apiStatus === "checking" ? "secondary" : "destructive"}
        className="flex items-center gap-1"
      >
        {apiStatus === "connected" ? <Server className="h-3 w-3" /> : <ServerOff className="h-3 w-3" />}
        API: {apiStatus === "checking" ? "Checking..." : apiStatus}
      </Badge>

      <Badge variant={socketStatus === "connected" ? "default" : "destructive"} className="flex items-center gap-1">
        {socketStatus === "connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        Socket: {socketStatus}
      </Badge>
    </div>
  )
}
