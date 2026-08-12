import "server-only"

export class ProfileError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "ProfileError"
  }
}

export function isValidUidFor(uid: string, length: number): boolean {
  if (length <= 0) return false
  return new RegExp(`^\\d{${length}}$`).test(uid.trim())
}
