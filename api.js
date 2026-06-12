// ============================================================
// 33buy — Ponder API client
// Proxy: /api/* → Ponder (localhost:42069 in dev, same-origin in prod)
// ============================================================

const BASE = '/api'

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(BASE + path, opts)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data
}

// ── Orders ──

/// POST /api/orders — Create shipping order, returns { orderRef }
export async function createOrder(shipping) {
  return request('POST', '/orders', shipping)
}

/// GET /api/orders/:orderRef — Single order with shipping + onchain
export async function getOrder(orderRef) {
  return request('GET', `/orders/${orderRef}`)
}

/// GET /api/orders/user/:address — List user orders
export async function getUserOrders(address, limit = 50) {
  return request('GET', `/orders/user/${address}?limit=${limit}`)
}

/// PATCH /api/orders/:orderRef — Update status (shipped/completed/cancelled)
export async function updateOrderStatus(orderRef, status) {
  return request('PATCH', `/orders/${orderRef}`, { status })
}

// ── Addresses ──

/// GET /api/addresses/:address — List addresses for a wallet
export async function getAddresses(address) {
  const data = await request('GET', `/addresses/${address.toLowerCase()}`)
  return data.addresses || []
}

/// POST /api/addresses — Create a new address
export async function createAddress(address) {
  return request('POST', '/addresses', address)
}

/// PATCH /api/addresses/:id — Update an address
export async function updateAddress(id, address) {
  return request('PATCH', `/addresses/${id}`, address)
}

/// DELETE /api/addresses/:id?address=0x... — Delete an address
export async function deleteAddress(id, address) {
  return request('DELETE', `/addresses/${id}?address=${encodeURIComponent(address)}`)
}

// ── Health ──

/// GET /api/healthcheck
export async function healthCheck() {
  return request('GET', '/healthcheck')
}
