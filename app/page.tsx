'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreditCard } from 'lucide-react'
import { PaymentTable } from '@/components/payment-table'
import { AdminPanel } from '@/components/admin-panel'
import { Button } from '@/components/ui/button'
import { usePaymentData } from '@/hooks/use-payment-data'

export default function Home() {
  const { data, isLoading, togglePayment, setTotalAmount } = usePaymentData()
  const [showAdmin, setShowAdmin] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null)

  const handleNameClick = useCallback((userId: string) => {
    if (userId !== 'marton-david') {
      setClickCount(0)
      if (clickTimer) clearTimeout(clickTimer)
      return
    }

    const newCount = clickCount + 1

    if (clickTimer) clearTimeout(clickTimer)

    if (newCount >= 3) {
      setShowAdmin(true)
      setClickCount(0)
      return
    }

    setClickCount(newCount)

    const timer = setTimeout(() => {
      setClickCount(0)
    }, 2000)

    setClickTimer(timer)
  }, [clickCount, clickTimer])

  useEffect(() => {
    return () => {
      if (clickTimer) clearTimeout(clickTimer)
    }
  }, [clickTimer])

  if (isLoading || !data) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="px-4 py-6 max-w-lg mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1 text-balance">
            Netflix Elofizetes
          </h1>
          <p className="text-sm text-muted-foreground">
            2027 Jan - Dec | Fizetesi hatarido: 25.
          </p>
        </header>

        <div className="bg-card rounded-xl p-4 mb-6 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Eddig birtokolt összeg
          </p>
          <p className="text-3xl font-bold text-foreground">
            {data.totalAmount.toLocaleString('hu-HU')} <span className="text-lg font-normal text-muted-foreground">EUR</span>
          </p>
        </div>

        <div className="bg-card rounded-xl p-3 border border-border">
          <PaymentTable data={data} onNameClick={handleNameClick} />
        </div>

        <Button asChild className="w-full mt-6 bg-white text-black hover:bg-white/90 border-0" size="lg">
          <a href="https://revolut.me/davidmarton07" target="_blank" rel="noopener noreferrer">
            <CreditCard className="mr-2 h-4 w-4" />
            Kártyával fizetnél
          </a>
        </Button>
      </div>

      {showAdmin && (
        <AdminPanel
          data={data}
          onTogglePayment={togglePayment}
          onSetTotalAmount={setTotalAmount}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </main>
  )
}
