'use client'

import { useState, useEffect, useCallback } from 'react'
import { PaymentTable } from '@/components/payment-table'
import { AdminPanel } from '@/components/admin-panel'
import { usePaymentData } from '@/hooks/use-payment-data'
import { USERS, MONTHS, AppData } from '@/lib/types'
import { Lock, CreditCard, CheckCircle2, Clock, Calendar } from 'lucide-react'

function PaymentStatus({ data }: { data: AppData }) {
  const now = new Date()
  const day = now.getDate()
  const currentMonthIndex = now.getMonth()

  // From the 29th onward we're collecting for next month
  const targetMonthIndex = day >= 29 ? (currentMonthIndex + 1) % 12 : currentMonthIndex
  const targetMonth = MONTHS[targetMonthIndex]

  const allPaid = USERS.every(
    (user) => data.payments[user.id]?.[targetMonth.id] ?? false,
  )

  const isWaiting = !allPaid && day >= 25 && day <= 28

  const statusText = allPaid
    ? 'Mindenki fizetett'
    : isWaiting
      ? 'Várakozás a fizetésre'
      : 'Gyűjtési időszak'

  const statusColor = allPaid
    ? 'text-emerald-400'
    : isWaiting
      ? 'text-amber-400'
      : 'text-sky-400'

  const statusBg = allPaid
    ? 'border-emerald-500/30 bg-emerald-500/10'
    : isWaiting
      ? 'border-amber-500/30 bg-amber-500/10'
      : 'border-sky-500/30 bg-sky-500/10'

  const StatusIcon = allPaid ? CheckCircle2 : isWaiting ? Clock : Calendar

  const periodLabel =
    day >= 29
      ? `${day}. – következő hónap 25.`
      : day >= 25
        ? `25. – 28.`
        : `1. – 25.`

  return (
    <div className={`rounded-xl p-4 mb-4 border ${statusBg}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Fizetési állapot
          </p>
          <p className="text-base font-semibold text-foreground">
            {targetMonth.fullName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
          <p className={`text-sm font-bold ${statusColor} text-right`}>
            {statusText}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { data, isLoading, togglePayment, setTotalAmount } = usePaymentData()
  const [showAdmin, setShowAdmin] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null)

  const handleNameClick = useCallback(
    (userId: string) => {
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
    },
    [clickCount, clickTimer],
  )

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
              Netflix Előfizetés
            </h1>
            <p className="text-sm text-muted-foreground">
              2027 Jan – Dec | Fizetési határidő: 25.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdmin(true)}
            className="mt-1 w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-border transition-colors"
            aria-label="Admin panel megnyitása"
          >
            <Lock className="w-4 h-4" />
          </button>
        </header>

        <div className="bg-card rounded-xl p-4 mb-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Eddig birtokolt összeg
          </p>
          <p className="text-3xl font-bold text-foreground">
            {data.totalAmount.toLocaleString('hu-HU')}{' '}
            <span className="text-lg font-normal text-muted-foreground">EUR</span>
          </p>
        </div>

        <PaymentStatus data={data} />

        <div className="bg-card rounded-xl p-3 border border-border mb-4">
          <PaymentTable data={data} onNameClick={handleNameClick} />
        </div>

        <a
          href="https://revolut.me/davidmarton07?currency=RON&amount=1424&note="
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-base transition-colors py-4 shadow-lg shadow-violet-900/30"
        >
          <CreditCard className="w-5 h-5" />
          Kártyával fizetnék
        </a>
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
