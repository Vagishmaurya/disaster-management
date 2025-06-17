"use client"

import { useState, useCallback } from "react"
import { apiClient } from "@/lib/api"

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const data = await apiCall()
      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

// Specific hooks for common operations
export function useDisasters() {
  const { data, loading, error, execute, reset } = useApi<any>()

  const fetchDisasters = useCallback(
    (params?: any) => {
      return execute(() => apiClient.getDisasters(params))
    },
    [execute],
  )

  const createDisaster = useCallback(
    (disaster: any) => {
      return execute(() => apiClient.createDisaster(disaster))
    },
    [execute],
  )

  const updateDisaster = useCallback(
    (id: string, disaster: any) => {
      return execute(() => apiClient.updateDisaster(id, disaster))
    },
    [execute],
  )

  const deleteDisaster = useCallback(
    (id: string, userId: string) => {
      return execute(() => apiClient.deleteDisaster(id, userId))
    },
    [execute],
  )

  return {
    disasters: data?.data || [],
    pagination: data?.pagination,
    loading,
    error,
    fetchDisasters,
    createDisaster,
    updateDisaster,
    deleteDisaster,
    reset,
  }
}

export function useReports() {
  const { data, loading, error, execute, reset } = useApi<any[]>()

  const fetchReports = useCallback(
    (params?: any) => {
      return execute(() => apiClient.getReports(params))
    },
    [execute],
  )

  const createReport = useCallback(
    (report: any) => {
      return execute(() => apiClient.createReport(report))
    },
    [execute],
  )

  return {
    reports: data || [],
    loading,
    error,
    fetchReports,
    createReport,
    reset,
  }
}
