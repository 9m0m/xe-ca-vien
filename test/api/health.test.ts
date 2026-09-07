import { describe, it, expect } from 'vitest'
import { app } from '../../api/index.js'

describe('Hono API v1 Health & Config', () => {
  it('should return health check status 200', async () => {
    const res = await app.request('/api/v1/health')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('ok')
    expect(body.data.service).toBe('xe-ca-vien-api')
  })

  it('should return valid game config 200 with schema validation', async () => {
    const res = await app.request('/api/v1/game/config')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.gameTitle).toBe('Xe Cá Viên')
    expect(body.data.locale).toBe('vi-VN')
    expect(body.data.defaultPanSlots).toBe(6)
    expect(body.data.features.guestSession).toBe(true)
  })

  it('should return structured 404 for unknown endpoints', async () => {
    const res = await app.request('/api/v1/unknown-route')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })
})
