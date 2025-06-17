import { io, Socket } from "socket.io-client"

type EventHandler = (...args: any[]) => void

class SocketManager {
  private socket: Socket | null = null
  private eventHandlers: Map<string, Set<EventHandler>> = new Map()
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  private debounceDelay: number = 300 // milliseconds

  connect() {
    if (!this.socket) {
      this.socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
        transports: ["websocket"],
      })

      this.socket.on("connect", () => {
        console.log("Socket connected:", this.socket?.id)
      })

      this.socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason)
      })

      // Register internal event dispatcher
      this.socket.onAny((event: string, ...args: any[]) => {
        this.dispatchEvent(event, ...args)
      })
    }
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.eventHandlers.clear()
      this.debounceTimers.forEach((timer) => clearTimeout(timer))
      this.debounceTimers.clear()
    }
  }

  joinDisasterRoom(disasterId: string) {
    if (this.socket) {
      this.socket.emit("join_disaster", disasterId)
    }
  }

  leaveDisasterRoom(disasterId: string) {
    if (this.socket) {
      this.socket.emit("leave_disaster", disasterId)
    }
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: string, handler: EventHandler) {
    this.eventHandlers.get(event)?.delete(handler)
  }

  private dispatchEvent(event: string, ...args: any[]) {
    const handlers = this.eventHandlers.get(event)
    if (!handlers || handlers.size === 0) return

    // Debounce event handlers to limit call frequency
    if (this.debounceTimers.has(event)) {
      clearTimeout(this.debounceTimers.get(event)!)
    }

    this.debounceTimers.set(
      event,
      setTimeout(() => {
        handlers.forEach((handler) => {
          try {
            handler(...args)
          } catch (error) {
            console.error(`Error in handler for event ${event}:`, error)
          }
        })
        this.debounceTimers.delete(event)
      }, this.debounceDelay),
    )
  }

  // Convenience methods for specific events
  onDisasterUpdated(handler: EventHandler) {
    this.on("disaster_updated", handler)
  }

  offDisasterUpdated(handler: EventHandler) {
    this.off("disaster_updated", handler)
  }

  onDisasterDeleted(handler: EventHandler) {
    this.on("disaster_deleted", handler)
  }

  offDisasterDeleted(handler: EventHandler) {
    this.off("disaster_deleted", handler)
  }

  onSocialMediaUpdated(handler: EventHandler) {
    this.on("social_media_updated", handler)
  }

  offSocialMediaUpdated(handler: EventHandler) {
    this.off("social_media_updated", handler)
  }

  onResourcesUpdated(handler: EventHandler) {
    this.on("resources_updated", handler)
  }

  offResourcesUpdated(handler: EventHandler) {
    this.off("resources_updated", handler)
  }
}

export const socketManager = new SocketManager()
