'use client'

import { USERS, MONTHS, AppData } from '@/lib/types'
import { Check } from 'lucide-react'

interface PaymentTableProps {
  data: AppData
  onNameClick?: (userId: string) => void
}

export function PaymentTable({ data, onNameClick }: PaymentTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-xs font-medium text-muted-foreground sticky left-0 bg-background min-w-[100px]">
              <span className="block text-balance">Felhasználó</span>
            </th>
            {MONTHS.map((month) => (
              <th
                key={month.id}
                className="p-1.5 text-center text-[10px] font-medium text-muted-foreground min-w-[36px]"
              >
                {month.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {USERS.map((user) => (
            <tr key={user.id} className="border-t border-border">
              <td className="p-2 sticky left-0 bg-background">
                <button
                  type="button"
                  onClick={() => onNameClick?.(user.id)}
                  className="text-sm font-medium text-foreground text-left leading-tight active:opacity-70 transition-opacity min-h-[44px] flex items-center"
                >
                  {user.name}
                  
                </button>
              </td>
              {MONTHS.map((month) => {
                const isPaid = data.payments[user.id]?.[month.id] ?? false
                return (
                  <td key={month.id} className="p-1.5 text-center">
                    <div
                      className={`w-7 h-7 mx-auto rounded-md flex items-center justify-center transition-all ${
                        isPaid
                          ? 'bg-success text-background'
                          : 'bg-secondary border border-border'
                      }`}
                    >
                      {isPaid && <Check className="w-4 h-4" strokeWidth={3} />}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
