// API client for connecting to Node.js/Express backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

interface PaginatedResponse<T> {
  data: T[]
  count: number
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.log(`🌐 API Request: ${config.method || "GET"} ${url}`)
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
        console.log(`✅ API Response: ${url}`, data)
      }

      return data
    } catch (error) {
      console.error(`❌ API Error: ${url}`, error)
      throw error
    }
  }

  // Disaster endpoints
  async getDisasters(params?: {
    tag?: string
    owner_id?: string
    limit?: number
    offset?: number
  }): Promise<PaginatedResponse<any>> {
    const searchParams = new URLSearchParams()
    if (params?.tag) searchParams.append("tag", params.tag)
    if (params?.owner_id) searchParams.append("owner_id", params.owner_id)
    if (params?.limit) searchParams.append("limit", params.limit.toString())
    if (params?.offset) searchParams.append("offset", params.offset.toString())

    const query = searchParams.toString()
    return this.request(`/api/disasters${query ? `?${query}` : ""}`)
  }

  async getDisaster(id: string): Promise<any> {
    return this.request(`/api/disasters/${id}`)
  }

  async createDisaster(disaster: {
    title: string
    location_name?: string
    description: string
    tags?: string[]
    owner_id: string
  }): Promise<any> {
    return this.request("/api/disasters", {
      method: "POST",
      body: JSON.stringify(disaster),
    })
  }

  async updateDisaster(
    id: string,
    disaster: {
      title?: string
      location_name?: string
      description?: string
      tags?: string[]
      user_id: string
    },
  ): Promise<any> {
    return this.request(`/api/disasters/${id}`, {
      method: "PUT",
      body: JSON.stringify(disaster),
    })
  }

  async deleteDisaster(id: string, user_id: string): Promise<any> {
    return this.request(`/api/disasters/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ user_id }),
    })
  }

  // Disaster-related data endpoints
  async getSocialMedia(disasterId: string): Promise<any[]> {
    return this.request(`/api/disasters/${disasterId}/social-media`)
  }

  async getResources(
    disasterId: string,
    params?: {
      lat?: number
      lng?: number
      radius?: number
    },
  ): Promise<any[]> {
    const searchParams = new URLSearchParams()
    if (params?.lat) searchParams.append("lat", params.lat.toString())
    if (params?.lng) searchParams.append("lng", params.lng.toString())
    if (params?.radius) searchParams.append("radius", params.radius.toString())

    const query = searchParams.toString()
    return this.request(`/api/disasters/${disasterId}/resources${query ? `?${query}` : ""}`)
  }

  async getOfficialUpdates(disasterId: string): Promise<any[]> {
    return this.request(`/api/disasters/${disasterId}/official-updates`)
  }

  async verifyImage(
    disasterId: string,
    data: {
      image_url: string
      report_id?: string
    },
  ): Promise<any> {
    return this.request(`/api/disasters/${disasterId}/verify-image`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Reports endpoints
  async createReport(report: {
    disaster_id: string
    user_id: string
    content: string
    image_url?: string
  }): Promise<any> {
    return this.request("/api/reports", {
      method: "POST",
      body: JSON.stringify(report),
    })
  }

  async getReports(params?: {
    disaster_id?: string
    user_id?: string
    verification_status?: string
  }): Promise<any[]> {
    const searchParams = new URLSearchParams()
    if (params?.disaster_id) searchParams.append("disaster_id", params.disaster_id)
    if (params?.user_id) searchParams.append("user_id", params.user_id)
    if (params?.verification_status) searchParams.append("verification_status", params.verification_status)

    const query = searchParams.toString()
    return this.request(`/api/reports${query ? `?${query}` : ""}`)
  }

  // Utility endpoints
  async geocodeLocation(location: string): Promise<any> {
    return this.request("/api/geocode", {
      method: "POST",
      body: JSON.stringify({ location }),
    })
  }

  async extractLocation(description: string): Promise<any> {
    return this.request("/api/gemini/extract-location", {
      method: "POST",
      body: JSON.stringify({ description }),
    })
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request("/health")
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export type { ApiResponse, PaginatedResponse }
