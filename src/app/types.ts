export interface JwtPayload {
  sub: string
  email: string
  name: string
  image?: string
  iat: number
  exp: number
}
