"use client"

import { useEffect, useRef } from "react"
import { socketManager } from "@/lib/socket"
import type { Socket } from "socket.io-client"

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Connect to socket on mount
    socketRef.current = socketManager.connect()

    // Cleanup on unmount
    return () => {
      socketManager.disconnect()
    }
  }, [])

  return {
    socket: socketRef.current,
    joinDisasterRoom: socketManager.joinDisasterRoom.bind(socketManager),
    leaveDisasterRoom: socketManager.leaveDisasterRoom.bind(socketManager),
    onDisasterUpdated: socketManager.onDisasterUpdated.bind(socketManager),
    onDisasterDeleted: socketManager.onDisasterDeleted.bind(socketManager),
    onSocialMediaUpdated: socketManager.onSocialMediaUpdated.bind(socketManager),
    onResourcesUpdated: socketManager.onResourcesUpdated.bind(socketManager),
    offDisasterUpdated: socketManager.offDisasterUpdated.bind(socketManager),
    offDisasterDeleted: socketManager.offDisasterDeleted.bind(socketManager),
    offSocialMediaUpdated: socketManager.offSocialMediaUpdated.bind(socketManager),
    offResourcesUpdated: socketManager.offResourcesUpdated.bind(socketManager),
  }
}
