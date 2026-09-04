export function isIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export function assertIanaTimeZone(value: string): void {
  if (!isIanaTimeZone(value)) throw new RangeError(`不正な IANA timezone です: ${value}`)
}
