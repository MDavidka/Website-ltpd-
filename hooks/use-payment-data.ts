"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import type { AppData } from "@/lib/types"
import { getInitialData } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function usePaymentData() {
  const { data, error, isLoading, mutate } = useSWR<AppData>("/api/payments", fetcher)

  const saveData = useCallback(
    async (newData: AppData) => {
      mutate(newData, false)
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      })
      mutate()
    },
    [mutate]
  )

  const togglePayment = useCallback(
    (userId: string, monthId: string) => {
      if (!data) return
      const newData = {
        ...data,
        payments: {
          ...data.payments,
          [userId]: {
            ...data.payments[userId],
            [monthId]: !data.payments[userId]?.[monthId],
          },
        },
      }
      saveData(newData)
    },
    [data, saveData]
  )

  const setTotalAmount = useCallback(
    (amount: number) => {
      if (!data) return
      const newData = { ...data, totalAmount: amount }
      saveData(newData)
    },
    [data, saveData]
  )

  return {
    data: isLoading ? null : (data || getInitialData()),
    isLoading,
    error,
    togglePayment,
    setTotalAmount,
  }
}
