'use client'

import { useState, useRef } from 'react'
import { USERS, MONTHS, AppData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Download, Check } from 'lucide-react'

interface AdminPanelProps {
  data: AppData
  onTogglePayment: (userId: string, monthId: string) => void
  onSetTotalAmount: (amount: number) => void
  onClose: () => void
}

export function AdminPanel({
  data,
  onTogglePayment,
  onSetTotalAmount,
  onClose,
}: AdminPanelProps) {
  const [amountInput, setAmountInput] = useState(data.totalAmount.toString())
  const printRef = useRef<HTMLDivElement>(null)

  const handleAmountChange = (value: string) => {
    setAmountInput(value)
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      onSetTotalAmount(num)
    }
  }

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const styles = `
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1a1a1a; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        .subtitle { color: #666; margin-bottom: 24px; font-size: 14px; }
        .total { font-size: 18px; margin-bottom: 24px; padding: 16px; background: #f5f5f5; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 11px; }
        th { background: #f9f9f9; font-weight: 600; }
        th:first-child, td:first-child { text-align: left; min-width: 120px; }
        .paid { background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
        .unpaid { background: #f1f1f1; padding: 4px 8px; border-radius: 4px; color: #999; }
        .footer { margin-top: 32px; font-size: 12px; color: #666; }
      </style>
    `

    const tableRows = USERS.map(user => {
      const cells = MONTHS.map(month => {
        const isPaid = data.payments[user.id]?.[month.id] ?? false
        return `<td><span class="${isPaid ? 'paid' : 'unpaid'}">${isPaid ? '✓' : '—'}</span></td>`
      }).join('')
      return `<tr><td><strong>${user.name}</strong></td>${cells}</tr>`
    }).join('')

    const monthHeaders = MONTHS.map(m => `<th>${m.name}</th>`).join('')

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Netflix Elofizetes - Export</title>
          ${styles}
        </head>
        <body>
          <h1>Netflix Elofizetes Koveto</h1>
          <p class="subtitle">2027 Január - December | Fizetési határidő: minden hónap 25.</p>
          <div class="total">
            <strong>Eddig birtokolt összeg:</strong> ${data.totalAmount.toLocaleString('hu-HU')} EUR
          </div>
          <table>
            <thead>
              <tr>
                <th>Felhasználó</th>
                ${monthHeaders}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <p class="footer">Exportálva: ${new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto">
      <div className="min-h-full p-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Admin Panel</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-secondary text-foreground active:bg-border transition-colors"
              aria-label="Bezárás"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Eddig birtokolt összeg (EUR)
              </label>
              <Input
                type="number"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="text-lg font-semibold h-12"
                min={0}
              />
            </div>

            <div className="bg-card rounded-xl p-4 border border-border" ref={printRef}>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Fizetések kezelése
              </h3>
              <div className="space-y-4">
                {USERS.map((user) => (
                  <div key={user.id}>
                    <p className="text-sm font-medium text-foreground mb-2">{user.name}</p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {MONTHS.map((month) => {
                        const isPaid = data.payments[user.id]?.[month.id] ?? false
                        return (
                          <button
                            key={month.id}
                            type="button"
                            onClick={() => onTogglePayment(user.id, month.id)}
                            className={`h-10 rounded-lg text-[10px] font-medium flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                              isPaid
                                ? 'bg-success text-background'
                                : 'bg-secondary text-muted-foreground border border-border'
                            }`}
                          >
                            <span>{month.name}</span>
                            {isPaid && <Check className="w-3 h-3" strokeWidth={3} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleExportPDF}
              className="w-full h-12 text-base font-medium"
            >
              <Download className="w-5 h-5 mr-2" />
              Exportálás A4 PDF-be
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
