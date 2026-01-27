export interface PaymentData {
  [userId: string]: {
    [month: string]: boolean
  }
}

export interface AppData {
  payments: PaymentData
  totalAmount: number
}

export const USERS = [
  { id: 'marton-david', name: 'Márton Dávid' },
  { id: 'mathe-istvan', name: 'Máthé István' },
  { id: 'szabo-timea', name: 'Szabó Tímea' },
  { id: 'petra-krisztina', name: 'Petrea Krisztina' },
] as const

export const MONTHS = [
  { id: 'jan', name: 'Jan', fullName: 'Január' },
  { id: 'feb', name: 'Feb', fullName: 'Február' },
  { id: 'mar', name: 'Már', fullName: 'Március' },
  { id: 'apr', name: 'Ápr', fullName: 'Április' },
  { id: 'maj', name: 'Máj', fullName: 'Május' },
  { id: 'jun', name: 'Jún', fullName: 'Június' },
  { id: 'jul', name: 'Júl', fullName: 'Július' },
  { id: 'aug', name: 'Aug', fullName: 'Augusztus' },
  { id: 'sep', name: 'Szep', fullName: 'Szeptember' },
  { id: 'okt', name: 'Okt', fullName: 'Október' },
  { id: 'nov', name: 'Nov', fullName: 'November' },
  { id: 'dec', name: 'Dec', fullName: 'December' },
] as const

export const STORAGE_KEY = 'netflix-payment-tracker'

export function getInitialData(): AppData {
  return {
    payments: USERS.reduce((acc, user) => {
      acc[user.id] = MONTHS.reduce((monthAcc, month) => {
        monthAcc[month.id] = false
        return monthAcc
      }, {} as { [month: string]: boolean })
      return acc
    }, {} as PaymentData),
    totalAmount: 0,
  }
}
