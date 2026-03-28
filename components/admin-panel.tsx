'use client'

import { useState, useRef } from 'react'
import { USERS, MONTHS, AppData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Download, Check, UserPlus } from 'lucide-react'

interface AdminPanelProps {
  data: AppData
  onTogglePayment: (userId: string, monthId: string) => void
  onSetTotalAmount: (amount: number) => void
  onSetDebt: (userId: string, amount: number) => void
  onAddUser: (id: string, name: string) => void
  onRenameUser: (id: string, newName: string) => void
  onClose: () => void
}

export function AdminPanel({
  data,
  onTogglePayment,
  onSetTotalAmount,
  onSetDebt,
  onAddUser,
  onRenameUser,
  onClose,
}: AdminPanelProps) {
  const [amountInput, setAmountInput] = useState(data.totalAmount.toString())
  const [newUserName, setNewUserName] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingUserName, setEditingUserName] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const allUsers = [...USERS, ...(data.dynamicUsers ?? [])]

  const handleAmountChange = (value: string) => {
    setAmountInput(value)
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      onSetTotalAmount(num)
    }
  }

  const handleAddUser = () => {
    const name = newUserName.trim()
    if (!name) return
    const id = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    onAddUser(id, name)
    setNewUserName('')
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
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 11px; }
        th { background: #f9f9f9; font-weight: 600; }
        th:first-child, td:first-child { text-align: left; min-width: 120px; }
        .paid { background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
        .unpaid { background: #f1f1f1; padding: 4px 8px; border-radius: 4px; color: #999; }
        .debt { color: #e11d48; font-size: 10px; }
        .footer { margin-top: 32px; font-size: 12px; color: #666; }
      </style>
    `

    const tableRows = allUsers.map(user => {
      const cells = MONTHS.map(month => {
        const isPaid = data.payments[user.id]?.[month.id] ?? false
        return `<td><span class="${isPaid ? 'paid' : 'unpaid'}">${isPaid ? '✓' : '—'}</span></td>`
      }).join('')
      const debt = data.debts?.[user.id]
      const debtLabel = debt && debt > 0 ? `<br/><span class="debt">Tartozás: ${debt.toLocaleString('hu-HU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON</span>` : ''
      return `<tr><td><strong>${user.name}</strong>${debtLabel}</td>${cells}</tr>`
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

            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Új személy hozzáadása
              </h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Teljes név"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddUser}
                  disabled={!newUserName.trim()}
                  className="shrink-0"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Hozzáad
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border" ref={printRef}>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Fizetések és tartozások kezelése
              </h3>
              <div className="space-y-6">
                {allUsers.map((user) => {
                  const isDynamicUser = data.dynamicUsers?.some(u => u.id === user.id) ?? false
                  const isEditing = editingUserId === user.id
                  return (
                  <div key={user.id}>
                    <div className="flex items-center gap-3 mb-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="text"
                            value={editingUserName}
                            onChange={(e) => setEditingUserName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editingUserName.trim()) {
                                onRenameUser(user.id, editingUserName.trim())
                                setEditingUserId(null)
                                setEditingUserName('')
                              } else if (e.key === 'Escape') {
                                setEditingUserId(null)
                                setEditingUserName('')
                              }
                            }}
                            className="flex-1 h-7 text-sm"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={!editingUserName.trim()}
                            onClick={() => {
                              if (editingUserName.trim()) {
                                onRenameUser(user.id, editingUserName.trim())
                              }
                              setEditingUserId(null)
                              setEditingUserName('')
                            }}
                            className="h-7 px-2"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (isDynamicUser) {
                              setEditingUserId(user.id)
                              setEditingUserName(user.name)
                            }
                          }}
                          className={`text-sm font-medium text-foreground flex-1 text-left ${isDynamicUser ? 'cursor-pointer hover:text-primary' : 'cursor-default'}`}
                          title={isDynamicUser ? 'Kattints a szerkesztéshez' : ''}
                        >
                          {user.name}
                        </button>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Tartozás:</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={data.debts?.[user.id] ?? 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            onSetDebt(user.id, isNaN(val) ? 0 : val)
                          }}
                          className="w-24 h-7 text-xs text-rose-400 font-semibold px-2"
                        />
                        <span className="text-xs text-muted-foreground">RON</span>
                      </div>
                    </div>
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
                )})}
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
