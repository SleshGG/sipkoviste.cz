export type ReservationErrorCode =
  | 'ALREADY_RESERVED'
  | 'ALREADY_SOLD'
  | 'RESERVATION_EXPIRED'
  | 'OWN_PRODUCT'
  | 'NOT_LOGGED_IN'
  | 'NOT_OWNER'
  | 'NOT_RESERVED'
  | 'UNKNOWN'

export interface ReservationError {
  code: ReservationErrorCode
  message: string
}

const ERROR_MAP: Record<string, ReservationErrorCode> = {
  'Tento produkt je již rezervován.': 'ALREADY_RESERVED',
  'Produkt není k dispozici.': 'ALREADY_RESERVED',
  'Tento produkt byl již prodán.': 'ALREADY_SOLD',
  'Rezervace vypršela.': 'RESERVATION_EXPIRED',
  'Nemůžete rezervovat vlastní produkt.': 'OWN_PRODUCT',
  'Musíte být přihlášeni.': 'NOT_LOGGED_IN',
  'Prodej může potvrdit pouze prodejce.': 'NOT_OWNER',
  'Rezervaci může zrušit pouze prodejce.': 'NOT_OWNER',
  'Produkt není rezervován.': 'NOT_RESERVED',
  'Rezervace je neplatná.': 'RESERVATION_EXPIRED',
}

export function parseReservationRpcError(
  rpcResult: { ok?: boolean; error?: string } | null,
  rpcError: { message?: string } | null
): ReservationError | null {
  const err = rpcResult?.error ?? rpcError?.message
  if (!err) return null

  const code = ERROR_MAP[err] ?? 'UNKNOWN'
  return { code, message: err }
}

export function getReservationErrorMessage(error: ReservationError): string {
  switch (error.code) {
    case 'ALREADY_RESERVED':
      return 'Tento produkt je již rezervován.'
    case 'ALREADY_SOLD':
      return 'Tento produkt byl již prodán.'
    case 'RESERVATION_EXPIRED':
      return 'Rezervace vypršela.'
    case 'OWN_PRODUCT':
      return 'Nemůžete rezervovat vlastní produkt.'
    case 'NOT_LOGGED_IN':
      return 'Musíte být přihlášeni.'
    case 'NOT_OWNER':
      return 'Tuto akci může provést pouze prodejce.'
    case 'NOT_RESERVED':
      return 'Produkt není rezervován.'
    default:
      return error.message
  }
}

export function handleReservationResult(
  rpcResult: { ok?: boolean; error?: string } | null,
  rpcError: { message?: string } | null
): { success: boolean; error?: string } {
  if (rpcError) {
    const parsed = parseReservationRpcError(null, rpcError)
    return { success: false, error: parsed ? getReservationErrorMessage(parsed) : rpcError.message }
  }
  if (rpcResult && !rpcResult.ok) {
    const parsed = parseReservationRpcError(rpcResult, null)
    return { success: false, error: parsed ? getReservationErrorMessage(parsed) : rpcResult.error }
  }
  return { success: true }
}
