import { SignJWT, jwtVerify } from 'jose'
import { config } from '../config.js'

const secret = new TextEncoder().encode(config.jwtSecret)

export const AUD_ADMIN = 'admin'
export const AUD_COMMUNITY = 'community'

export async function signToken(payload, { audience = AUD_ADMIN } = {}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(config.jwtExpiresIn)
    .sign(secret)
}

export async function verifyToken(token, { audience } = {}) {
  const opts = audience ? { audience } : undefined
  const { payload } = await jwtVerify(token, secret, opts)
  return payload
}
