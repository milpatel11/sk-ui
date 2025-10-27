"use client"
import {useEffect, useState} from 'react'
import {Approval} from '@/lib/types'
import {approveApproval, getApprovals, rejectApproval} from '@/lib/tmsClient'
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemText,
    Stack,
    TextField,
    Typography
} from '@mui/material'

export default function ApprovalsDialog({ tenantId, taskId, open, onClose }: { tenantId: string; taskId: string | null; open: boolean; onClose: (changed?: boolean) => void }) {
  const [items, setItems] = useState<Approval[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [comments, setComments] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!open || !taskId) return
      setLoading(true)
      setError(null)
      try {
        const list = await getApprovals(tenantId, { taskId })
        if (!cancelled) setItems(list as any)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load approvals')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, tenantId, taskId])

  async function doApprove(a: Approval) {
    if (busy) return
    try {
      setBusy(true)
      await approveApproval(tenantId, a.approvalId, { comment: comments[a.approvalId] || '' })
      const list = await getApprovals(tenantId, { taskId: taskId! })
      setItems(list as any)
    } catch (e: any) {
      alert(e?.message || 'Approve failed')
    } finally {
      setBusy(false)
    }
  }

  async function doReject(a: Approval) {
    if (busy) return
    try {
      setBusy(true)
      await rejectApproval(tenantId, a.approvalId, { comment: comments[a.approvalId] || '' })
      const list = await getApprovals(tenantId, { taskId: taskId! })
      setItems(list as any)
    } catch (e: any) {
      alert(e?.message || 'Reject failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>Approvals{taskId ? ` — Task ${taskId}` : ''}</DialogTitle>
      <DialogContent dividers>
        {loading && <Typography color="text.secondary">Loading…</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && items.length === 0 && (
          <Typography color="text.secondary">No approvals</Typography>
        )}
        {!loading && !error && items.length > 0 && (
          <List dense>
            {items.map((a) => (
              <ListItem key={a.approvalId} disableGutters secondaryAction={
                a.status === 'pending' ? (
                  <Stack direction="column" spacing={1} sx={{ minWidth: 260 }}>
                    <TextField size="small" label="Comment (optional)" value={comments[a.approvalId] || ''} onChange={e => setComments(m => ({ ...m, [a.approvalId]: e.target.value }))} />
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" color="success" onClick={() => doApprove(a)} disabled={busy}>Approve</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => doReject(a)} disabled={busy}>Reject</Button>
                    </Stack>
                  </Stack>
                ) : undefined
              }>
                <ListItemText primary={`${a.status} — seq ${a.sequence ?? '—'}`}
                              secondary={`Approver: ${a.approverGlobalUserId || a.approverApplicationUserId || a.approverGroupId || '—'}`} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}