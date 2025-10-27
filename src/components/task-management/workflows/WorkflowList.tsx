"use client"
import {getWorkflows} from '@/lib/tmsClient'
import {useEffect, useState} from 'react'
import {Button, List, ListItem, ListItemButton, ListItemText, Paper, Stack, Typography} from '@mui/material'
import Link from 'next/link'
import WorkflowCreateDialog from './WorkflowCreateDialog'

export default function WorkflowList({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await getWorkflows(tenantId)
      setItems(data as any)
    } catch (e: any) {
      setError(e?.message || 'Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getWorkflows(tenantId)
      .then((data) => { if (!cancelled) setItems(data as any) })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load workflows') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tenantId])

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700}>Workflows</Typography>
        <Button variant="contained" size="small" onClick={() => setCreateOpen(true)}>New Workflow</Button>
      </Stack>
      {loading && <Typography color="text.secondary">Loading…</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && (
        <List>
          {items.map(w => (
            <ListItem key={w.id} disablePadding>
              <ListItemButton component={Link} href={`/tenant/${tenantId}/task-management/workflows/${w.id}`}>
                <ListItemText primary={w.name} secondary={w.description || undefined} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      <WorkflowCreateDialog tenantId={tenantId} open={createOpen} onClose={(created) => { setCreateOpen(false); if (created) load() }} />
    </Paper>
  )
}