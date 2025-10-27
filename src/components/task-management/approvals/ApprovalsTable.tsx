"use client"
import {useEffect, useState} from 'react'
import {getApprovals} from "@/lib/tmsClient";
import {
  Button,
  Paper,
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

export default function ApprovalsTable({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ approverId?: string; taskId?: string; status?: string }>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getApprovals(tenantId, filters)
      .then((data)=>{ if(!cancelled) setItems(data as any) })
      .catch((e)=>{ if(!cancelled) setError(e?.message || 'Failed to load approvals') })
      .finally(()=>{ if(!cancelled) setLoading(false) })
    return ()=>{ cancelled = true }
  }, [tenantId, filters])

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>Approvals</Typography>
      <Stack direction={{xs: 'column', sm: 'row'}} spacing={1} useFlexGap flexWrap="wrap" mb={2}>
        <TextField size="small" label="Approver ID" value={filters.approverId || ''} onChange={(e)=>setFilters(f=>({ ...f, approverId: e.target.value || undefined }))} />
        <TextField size="small" label="Task ID" value={filters.taskId || ''} onChange={(e)=>setFilters(f=>({ ...f, taskId: e.target.value || undefined }))} />
        <TextField size="small" label="Status" value={filters.status || ''} onChange={(e)=>setFilters(f=>({ ...f, status: e.target.value || undefined }))} />
        <Stack direction="row" spacing={1} ml={{sm: 'auto'}}>
          <Button size="small" variant="outlined" onClick={()=>setFilters({})}>Clear</Button>
        </Stack>
      </Stack>
      {loading && <Typography color="text.secondary">Loading…</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Approval ID</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Approver</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(a => (
                <TableRow key={a.approvalId} hover>
                  <TableCell>{a.approvalId}</TableCell>
                  <TableCell>{a.taskId}</TableCell>
                  <TableCell>{a.status}</TableCell>
                  <TableCell>{a.approverGlobalUserId || a.approverApplicationUserId || a.approverGroupId || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}