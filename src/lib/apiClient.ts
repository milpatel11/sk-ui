import * as mocks from './mocks'

export interface ApiError {
    status: number;
    message: string;
    details?: unknown;
}

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
const BASE = (process.env.NEXT_PUBLIC_CORE_BASE || process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')

function buildHeaders(extra?: HeadersInit): HeadersInit {
    const h: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken')
        const tenantId = localStorage.getItem('tenantId')
        if (token) h['Authorization'] = `Bearer ${token}`
        if (tenantId) h['X-Tenant-Id'] = tenantId
    }
    return { ...h, ...(extra || {}) }
}

async function doFetch(method: string, url: string, data?: unknown, init?: RequestInit) {
    if (useMocks) {
        const m: any = mocks
        if (method === 'GET') return m.mockGet(url)
        if (method === 'POST') return m.mockPost(url, data)
        if (method === 'PATCH') return (m.mockPatch ? m.mockPatch(url, data) : m.mockPost(url, data))
        if (method === 'PUT') return (m.mockPut ? m.mockPut(url, data) : m.mockPost(url, data))
        if (method === 'DELETE') return (m.mockDelete ? m.mockDelete(url) : m.mockPost(url, data))
        throw { status: 400, message: `Unsupported method ${method}` }
    }
    if (!BASE && url.startsWith('/')) {
        // If no BASE provided and a relative URL is used, fallback to mocks to avoid network errors during local dev.
        const m: any = mocks
        if (method === 'GET') return m.mockGet(url)
        if (method === 'POST') return m.mockPost(url, data)
        if (method === 'PATCH') return (m.mockPatch ? m.mockPatch(url, data) : m.mockPost(url, data))
        if (method === 'PUT') return (m.mockPut ? m.mockPut(url, data) : m.mockPost(url, data))
        if (method === 'DELETE') return (m.mockDelete ? m.mockDelete(url) : m.mockPost(url, data))
    }
    const full = url.startsWith('http') ? url : `${BASE}${url}`
    const res = await fetch(full, {
        method,
        headers: buildHeaders(init?.headers as any),
        body: data != null ? JSON.stringify(data) : undefined,
        credentials: 'include',
        cache: 'no-store',
        ...init,
    })
    if (!res.ok) {
        let payload: any = undefined
        try { payload = await res.json() } catch {}
        const apiError: ApiError = {
            status: res.status,
            message: payload?.message || res.statusText || 'Unknown error',
            details: payload,
        }
        throw apiError
    }
    let parsed: any = null
    if (res.status !== 204) {
        try { parsed = await res.json() } catch { parsed = null }
    }
    return { data: parsed }
}

export const apiClient = {
    get: (url: string, init?: RequestInit) => doFetch('GET', url, undefined, init),
    post: (url: string, data?: unknown, init?: RequestInit) => doFetch('POST', url, data, init),
    patch: (url: string, data?: unknown, init?: RequestInit) => doFetch('PATCH', url, data, init),
    put: (url: string, data?: unknown, init?: RequestInit) => doFetch('PUT', url, data, init),
    delete: (url: string, init?: RequestInit) => doFetch('DELETE', url, undefined, init),
}

export default apiClient