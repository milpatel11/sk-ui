import * as mocks from './mocks'

const BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/+$/, '')
const useMocks = !BASE || process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

function buildHeaders(tenantId: string, extra: Record<string, string> = {}) {
  return {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    ...extra,
  }
}

async function request<T>(tenantId: string, path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || 'GET').toUpperCase()
  const body = init?.body ? (typeof init.body === 'string' ? safeParse(init.body) : init.body) : undefined
  if (useMocks) {
    // Route to in-memory mocks
    const url = path // path already includes /tms prefix
    const m: any = mocks
    if (method === 'GET') return (await m.mockGet(url)).data as T
    if (method === 'POST') return (await m.mockPost(url, body)).data as T
    if (method === 'PUT') return (await (m.mockPut ? m.mockPut(url, body) : m.mockPost(url, body))).data as T
    if (method === 'PATCH') return (await (m.mockPatch ? m.mockPatch(url, body) : m.mockPost(url, body))).data as T
    if (method === 'DELETE') return (await (m.mockDelete ? m.mockDelete(url) : m.mockPost(url, body))).data as T
    throw new Error(`Unsupported method: ${method}`)
  }
  // Real backend
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(tenantId, (init?.headers as any) || {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    let err: any = undefined
    try { err = await res.json() } catch {}
    throw err || new Error(`${res.status} ${res.statusText}`)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

function safeParse(s: string) { try { return JSON.parse(s) } catch { return s } }

// Helper for absolute/relative URL when calling non-mock endpoints (legacy fetch* fns below)
function url(path: string) {
  return BASE ? `${BASE}${path.startsWith('/') ? '' : '/'}${path}` : path
}

// ---------------- TMS endpoints (tenant-scoped) ----------------
// Tasks
export function getTasks(tenantId: string, params: Record<string, any> = {}) {
  const normalized = normalize(params)
  const qs = new URLSearchParams(normalized as any).toString()
  return request<any[]>(tenantId, `/tms/tasks${qs ? `?${qs}` : ''}`)
}
export function getTask(tenantId: string, id: string) {
  return request<any>(tenantId, `/tms/tasks/${id}`)
}
export function assignTask(tenantId: string, id: string, assigneeId: string) {
  const qs = new URLSearchParams({ assigneeId }).toString()
  return request<any>(tenantId, `/tms/tasks/${id}/assign?${qs}`, { method: 'POST' })
}
export function transitionTask(tenantId: string, id: string, to: string, reason?: string) {
  const qs = new URLSearchParams({ to, ...(reason ? { reason } : {}) }).toString()
  return request<any>(tenantId, `/tms/tasks/${id}/transition?${qs}`, { method: 'POST' })
}
export function updateTaskFields(tenantId: string, id: string, payload: any) {
  return request<any>(tenantId, `/tms/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

// Approvals
export function getApprovals(tenantId: string, params: Record<string, any> = {}) {
  const qs = new URLSearchParams(normalize(params) as any).toString()
  return request<any[]>(tenantId, `/tms/approvals${qs ? `?${qs}` : ''}`)
}
export function approveApproval(tenantId: string, id: string, payload?: any) {
  return request<any>(tenantId, `/tms/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify(payload || {}) })
}
export function rejectApproval(tenantId: string, id: string, payload?: any) {
  return request<any>(tenantId, `/tms/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify(payload || {}) })
}

// SLA Policies
export function getSlaPolicies(tenantId: string, params: Record<string, any> = {}) {
  const qs = new URLSearchParams(normalize(params) as any).toString()
  return request<any[]>(tenantId, `/tms/sla-policies${qs ? `?${qs}` : ''}`)
}
export function getSlaPolicy(tenantId: string, id: string) {
  return request<any>(tenantId, `/tms/sla-policies/${id}`)
}
export function createSlaPolicy(tenantId: string, payload: any) {
  return request<any>(tenantId, `/tms/sla-policies`, { method: 'POST', body: JSON.stringify(payload) })
}

// SLA Timers
export function getSlaTimers(tenantId: string, params: Record<string, any> = {}) {
  const qs = new URLSearchParams(normalize(params) as any).toString()
  return request<any[]>(tenantId, `/tms/sla-timers${qs ? `?${qs}` : ''}`)
}

// Workflows
export function getWorkflows(tenantId: string) {
  return request<any[]>(tenantId, `/tms/workflows`)
}
export function createWorkflow(tenantId: string, payload: any) {
  return request<any>(tenantId, `/tms/workflows`, { method: 'POST', body: JSON.stringify(payload) })
}
export function getWorkflow(tenantId: string, id: string) {
  return request<any>(tenantId, `/tms/workflows/${id}`)
}
export function getWorkflowStates(tenantId: string, params: Record<string, any>) {
  const qs = new URLSearchParams(normalize(params) as any).toString()
  return request<any[]>(tenantId, `/tms/workflow-states${qs ? `?${qs}` : ''}`)
}
export function createWorkflowState(tenantId: string, payload: any) {
  return request<any>(tenantId, `/tms/workflow-states`, { method: 'POST', body: JSON.stringify(payload) })
}
export function updateWorkflowState(tenantId: string, id: string, payload: any) {
  return request<any>(tenantId, `/tms/workflow-states/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export function deleteWorkflowState(tenantId: string, id: string) {
  return request<any>(tenantId, `/tms/workflow-states/${id}`, { method: 'DELETE' })
}
export function getWorkflowTransitions(tenantId: string, params: Record<string, any>) {
  const qs = new URLSearchParams(normalize(params) as any).toString()
  return request<any[]>(tenantId, `/tms/workflow-transitions${qs ? `?${qs}` : ''}`)
}
export function createWorkflowTransition(tenantId: string, payload: any) {
  return request<any>(tenantId, `/tms/workflow-transitions`, { method: 'POST', body: JSON.stringify(payload) })
}
export function updateWorkflowTransition(tenantId: string, id: string, payload: any) {
  return request<any>(tenantId, `/tms/workflow-transitions/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export function deleteWorkflowTransition(tenantId: string, id: string) {
  return request<any>(tenantId, `/tms/workflow-transitions/${id}`, { method: 'DELETE' })
}
export function getWorkflowInstances(tenantId: string, params: Record<string, any>) {
  const qs = new URLSearchParams(normalize(params) as any).toString()
  return request<any[]>(tenantId, `/tms/workflows/instances${qs ? `?${qs}` : ''}`)
}
export function createWorkflowInstance(tenantId: string, payload: any) {
  return request<any>(tenantId, `/tms/workflows/instances`, { method: 'POST', body: JSON.stringify(payload) })
}
export function updateWorkflowInstance(tenantId: string, id: string, payload: any) {
  return request<any>(tenantId, `/tms/workflows/instances/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export function deleteWorkflowInstance(tenantId: string, id: string) {
  return request<any>(tenantId, `/tms/workflows/instances/${id}`, { method: 'DELETE' })
}

function normalize(obj: Record<string, any>) {
  const out: Record<string, any> = {}
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v == null || v === '') return
    // map type_key -> typeKey for compatibility
    if (k === 'type_key') out['typeKey'] = v
    else out[k] = v
  })
  return out
}

// ---------------- Legacy generic fetch helpers (unused in current TM UI) ----------------
export async function fetchTasks(params?: { status?: string; assigneeId?: string; page?: string; workflowInstanceId?: string }) {
  const qs = params && Object.keys(params).length ? '?' + new URLSearchParams(params as any).toString() : ''
  const r = await fetch(url('/api/tasks') + qs)
  if (!r.ok) throw new Error('Failed to fetch tasks')
  const data = await r.json()
  if (Array.isArray(data)) return data.map(d => ({ ...(d as any), id: (d as any).taskId || (d as any).id }))
  return { ...(data as any), id: (data as any).taskId || (data as any).id }
}
export async function fetchTask(id: string) {
  const r = await fetch(url(`/api/tasks/${id}`))
  if (!r.ok) throw new Error('Failed to fetch task')
  const data = await r.json()
  return { ...(data as any), id: (data as any).taskId || (data as any).id }
}
export async function createTask(payload: any) {
  const r = await fetch(url('/api/tasks'), { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
  if (!r.ok) throw new Error('Failed to create task')
  const data = await r.json()
  return { ...(data as any), id: (data as any).taskId || (data as any).id }
}
export async function updateTask(id: string, payload: any) {
  const r = await fetch(url(`/api/tasks/${id}`), { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
  if (!r.ok) throw new Error('Failed to update task')
  const data = await r.json()
  return { ...(data as any), id: (data as any).taskId || (data as any).id }
}
export async function deleteTask(id: string) {
  const r = await fetch(url(`/api/tasks/${id}`), { method: 'DELETE' })
  if (!r.ok) throw new Error('Failed to delete task')
  return r.json()
}