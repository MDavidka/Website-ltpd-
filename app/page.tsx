'use client'

import { useState, useEffect, useCallback } from 'react'
import { PaymentTable } from '@/components/payment-table'
import { AdminPanel } from '@/components/admin-panel'
import { ExchangeRate } from '@/components/exchange-rate'
import { usePaymentData } from '@/hooks/use-payment-data'
import { Key } from 'lucide-react'

export default function Home() {
  const { data, isLoading, togglePayment, setTotalAmount } = usePaymentData()
  const [showAdmin, setShowAdmin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1 text-balance">
              Netflix Elofizetes
            </h1>
            <p className="text-sm text-muted-foreground">
              2027 Jan - Dec | Fizetesi hatarido: 25.
            </p>
          </div>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            aria-label="Jelszó mutatása"
          >
            <Key className="w-5 h-5" />
          </button>
        </header>

        {showPassword && (
          <div className="bg-card rounded-xl p-3 mb-6 border border-border text-sm animate-in fade-in slide-in-from-top-2">
            <div className="grid gap-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono font-medium select-all">netflix@ltpd.xyz</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Jelszó:</span>
                <span className="font-mono font-medium select-all">husbe6-donbow-keTduz</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl p-4 mb-6 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Eddig birtokolt összeg
          </p>
          <p className="text-3xl font-bold text-foreground flex flex-wrap items-baseline gap-2">
            <span>{data.totalAmount.toLocaleString('hu-HU')} <span className="text-lg font-normal text-muted-foreground">EUR</span></span>
            <ExchangeRate />
          </p>
        </div>

        <div className="bg-card rounded-xl p-3 border border-border">
          <PaymentTable data={data} onNameClick={handleNameClick} />
        </div>


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
