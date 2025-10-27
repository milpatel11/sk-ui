"use client"
import {useEffect, useState} from 'react'
import {Task, WorkflowInstance, WorkflowState} from '@/lib/types'
import {
  createWorkflowInstance,
  deleteWorkflowInstance,
  getTask,
  getWorkflowInstances,
  getWorkflows,
  getWorkflowStates,
  updateTaskFields,
  updateWorkflowInstance
} from '@/lib/tmsClient'
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Typography,
  TextField
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

export default function WorkflowInstancesDialog({ tenantId, taskId, workflowId, open, onClose, multiInstanceEnabled = false }: { tenantId: string; taskId?: string | null; workflowId?: string | null; open: boolean; onClose: (changed?: boolean) => void; multiInstanceEnabled?: boolean }) {
  const [items, setItems] = useState<WorkflowInstance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [workflows, setWorkflows] = useState<any[]>([])
  const [wfId, setWfId] = useState(workflowId || '')
  const [initStateId, setInitStateId] = useState('')
  const [states, setStates] = useState<WorkflowState[]>([])
  // New: creation fields
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')

  const [task, setTask] = useState<Task | null>(null)
  const defaultInstanceId = task?.workflowInstanceId || null
  const [dirty, setDirty] = useState(false)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!open) return
      setLoading(true)
      setError(null)
      try {
        // list instances
        let list: any[] = []
        if (taskId) list = await getWorkflowInstances(tenantId, { taskId }) as any
        else if (workflowId) list = await getWorkflowInstances(tenantId, { workflowId }) as any
        else list = await getWorkflowInstances(tenantId, {}) as any
        // list workflows
        const wfs = await getWorkflows(tenantId)
        // load task if provided
        let t: any = null
        if (taskId) t = await getTask(tenantId, taskId)
        if (!cancelled) {
          setItems(list as any)
          setWorkflows(wfs as any)
          setTask(t as any)
          setDirty(false)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load instances')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, tenantId, taskId, workflowId])

  useEffect(() => {
    let cancelled = false
    async function loadStates() {
      if (!open) return
      setStates([])
      if (!wfId) return
      try {
        const list = await getWorkflowStates(tenantId, { workflowId: wfId })
        if (!cancelled) setStates(list as any)
      } catch {
        if (!cancelled) setStates([])
      }
    }
    loadStates()
    return () => { cancelled = true }
  }, [open, tenantId, wfId])

  async function doCreate() {
    if (!multiInstanceEnabled || !wfId || busy) return
    try {
      setBusy(true)
      const payload: any = { workflowId: wfId }
      if (taskId) payload.taskId = taskId
      if (initStateId) payload.currentStateId = initStateId
      if (createName) payload.name = createName
      if (createDescription) payload.description = createDescription
      await createWorkflowInstance(tenantId, payload)
      const list = await getWorkflowInstances(tenantId, taskId ? { taskId } : workflowId ? { workflowId } : {})
      setItems(list as any)
      setInitStateId('')
      setCreateName('')
      setCreateDescription('')
      setDirty(true)
    } catch (e: any) {
      alert(e?.message || 'Create instance failed')
    } finally {
      setBusy(false)
    }
  }

  async function changeState(i: WorkflowInstance, newStateId: string) {
    if (!multiInstanceEnabled || busy) return
    try {
      setBusy(true)
      await updateWorkflowInstance(tenantId, i.id, { currentStateId: newStateId })
      const list = await getWorkflowInstances(tenantId, taskId ? { taskId } : workflowId ? { workflowId } : {})
      setItems(list as any)
      setDirty(true)
    } catch (e: any) {
      alert(e?.message || 'Update instance failed')
    } finally {
      setBusy(false)
    }
  }

  async function removeInstance(id: string) {
    if (!multiInstanceEnabled || busy) return
    try {
      setBusy(true)
      await deleteWorkflowInstance(tenantId, id)
      const list = await getWorkflowInstances(tenantId, taskId ? { taskId } : workflowId ? { workflowId } : {})
      setItems(list as any)
      setDirty(true)
    } catch (e: any) {
      alert(e?.message || 'Delete instance failed')
    } finally {
      setBusy(false)
    }
  }

  async function setDefault(i: WorkflowInstance) {
    if (!taskId || busy) return
    try {
      setBusy(true)
      await updateTaskFields(tenantId, taskId, { workflowInstanceId: i.id })
      const t = await getTask(tenantId, taskId)
      setTask(t as any)
      setDirty(true)
    } catch (e: any) {
      alert(e?.message || 'Set default failed')
    } finally {
      setBusy(false)
    }
  }

  function handleClose() { onClose(dirty) }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Workflow Instances{taskId ? ` — Task ${taskId}` : workflowId ? ` — Workflow ${workflowId}` : ''}</DialogTitle>
      <DialogContent dividers>
        {loading && <Typography color="text.secondary">Loading…</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && (
          <>
            <Typography variant="subtitle2" gutterBottom>Existing Instances</Typography>
            {items.length === 0 ? (
              <Typography color="text.secondary">No instances</Typography>
            ) : (
              <List dense>
                {items.map((i) => (
                  <ListItem key={i.id} disableGutters secondaryAction={
                    <Stack direction="row" spacing={1} alignItems="center">
                      {!!taskId && (
                        <Button size="small" onClick={() => setDefault(i)} disabled={busy || defaultInstanceId === i.id}>Set default</Button>
                      )}
                      {multiInstanceEnabled && (
                        <>
                          <Select size="small" value={i.currentStateId || ''} displayEmpty onChange={(e) => changeState(i, String(e.target.value))} sx={{ minWidth: 160 }}>
                            <MenuItem value=""><em>—</em></MenuItem>
                            {states.map(s => (
                              <MenuItem key={s.id || s.key} value={s.id || s.key}>{s.key}{s.name ? ` (${s.name})` : ''}</MenuItem>
                            ))}
                          </Select>
                          <IconButton size="small" color="error" onClick={() => setConfirmDeleteId(i.id)} disabled={busy}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  }>
                    <ListItemText primary={<>
                        {i.id} {defaultInstanceId === i.id && <Chip label="Default" size="small" sx={{ ml: 1 }} />}
                      </>} secondary={`Workflow: ${i.workflowId} — State: ${i.currentStateId || '—'}`} />
                  </ListItem>
                ))}
              </List>
            )}
            {multiInstanceEnabled && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>Create Instance</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField size="small" label="Name (optional)" value={createName} onChange={e => setCreateName(e.target.value)} sx={{ minWidth: 200 }} />
                  <TextField size="small" label="Description (optional)" value={createDescription} onChange={e => setCreateDescription(e.target.value)} sx={{ minWidth: 260 }} />
                  <Select size="small" value={wfId} onChange={e => setWfId(String(e.target.value))} displayEmpty sx={{ minWidth: 240 }}>
                    <MenuItem value=""><em>Select workflow…</em></MenuItem>
                    {workflows.map((w: any) => (
                      <MenuItem key={w.id} value={w.id}>{w.name || w.id}</MenuItem>
                    ))}
                  </Select>
                  <Select size="small" value={initStateId} onChange={e => setInitStateId(String(e.target.value))} displayEmpty sx={{ minWidth: 240 }} disabled={!wfId}>
                    <MenuItem value=""><em>Initial state (optional)</em></MenuItem>
                    {states.map(s => (
                      <MenuItem key={s.id || s.key} value={s.id || s.key}>{s.key}{s.name ? ` (${s.name})` : ''}</MenuItem>
                    ))}
                  </Select>
                  <Button variant="contained" size="small" onClick={doCreate} disabled={!wfId || busy}>Create</Button>
                </Stack>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete instance?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this workflow instance?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => { const id = confirmDeleteId!; setConfirmDeleteId(null); removeInstance(id) }} disabled={busy}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}