"use client"
import {useEffect, useState} from 'react'
import {getSlaTimers} from "@/lib/tmsClient";

export default function SlaTimerSearch({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ taskId?: string; slaPolicyId?: string; breached?: string }>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSlaTimers(tenantId, filters)
      .then((data)=>{ if(!cancelled) setItems(data as any) })
      .catch((e)=>{ if(!cancelled) setError(e?.message || 'Failed to load timers') })
      .finally(()=>{ if(!cancelled) setLoading(false) })
    return ()=>{ cancelled = true }
  }, [tenantId, JSON.stringify(filters)])

  return (
    <div style={{ padding: 16 }}>
      <h2>SLA Timers</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="taskId" value={filters.taskId || ''} onChange={(e)=>setFilters(f=>({ ...f, taskId: e.target.value || undefined }))} />
        <input placeholder="slaPolicyId" value={filters.slaPolicyId || ''} onChange={(e)=>setFilters(f=>({ ...f, slaPolicyId: e.target.value || undefined }))} />
        <select value={filters.breached || ''} onChange={(e)=>setFilters(f=>({ ...f, breached: e.target.value || undefined }))}>
          <option value="">breached?</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </div>
      {loading && <div>Loading…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {!loading && !error && (
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Timer</th>
              <th align="left">Task</th>
              <th align="left">Policy</th>
              <th align="left">Due</th>
              <th align="left">Breached</th>
            </tr>
          </thead>
          <tbody>
            {items.map(s => (
              <tr key={s.slaTimerId} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td>{s.slaTimerId}</td>
                <td>{s.taskId}</td>
                <td>{s.policyId}</td>
                <td>{s.dueAt ? new Date(s.dueAt).toLocaleString() : '—'}</td>
                <td>{String(!!s.breached)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
