'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ExchangeRate() {
  const { data, error, isLoading } = useSWR(
    'https://api.exchangerate-api.com/v4/latest/EUR',
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true
    }
  )

  if (isLoading) return <span className="text-sm text-muted-foreground animate-pulse ml-2">...</span>
  if (error) return null

  const rate = data?.rates?.RON
  if (!rate) return null

  const value = (2.8 * rate).toFixed(2)

  return (
    <span className="text-sm font-normal text-muted-foreground ml-2">
      (2.8 EUR ≈ {value} RON)
    </span>
  )
}
