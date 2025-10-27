"use client"
import {useEffect, useState} from 'react'
import {getSlaTimers} from "@/lib/tmsClient";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'

export default function SlaTimerSearch({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ taskId?: string; slaPolicyId?: string; breached?: string }>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSlaTimers(tenantId, filters)
      .then((data: any)=>{ if(!cancelled) setItems(data as any) })
      .catch((e: any)=>{ if(!cancelled) setError(e?.message || 'Failed to load timers') })
      .finally(()=>{ if(!cancelled) setLoading(false) })
    return ()=>{ cancelled = true }
  }, [tenantId, filters])

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>SLA Timers</Typography>
      <Stack direction={{xs: 'column', sm: 'row'}} spacing={1} useFlexGap flexWrap="wrap" mb={2}>
        <TextField size="small" label="Task ID" value={filters.taskId || ''} onChange={(e)=>setFilters(f=>({ ...f, taskId: e.target.value || undefined }))} />
        <TextField size="small" label="SLA Policy ID" value={filters.slaPolicyId || ''} onChange={(e)=>setFilters(f=>({ ...f, slaPolicyId: e.target.value || undefined }))} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="breached-label">Breached?</InputLabel>
          <Select labelId="breached-label" label="Breached?" value={filters.breached || ''} onChange={(e)=>setFilters(f=>({ ...f, breached: e.target.value || undefined }))}>
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="true">true</MenuItem>
            <MenuItem value="false">false</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      {loading && <Typography color="text.secondary">Loading…</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timer</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Policy</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Breached</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(s => (
                <TableRow key={s.slaTimerId} hover>
                  <TableCell>{s.slaTimerId}</TableCell>
                  <TableCell>{s.taskId}</TableCell>
                  <TableCell>{s.policyId}</TableCell>
                  <TableCell>{s.dueAt ? new Date(s.dueAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>{String(!!s.breached)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}