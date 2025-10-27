"use client"
import { useEffect, useState } from 'react'
import { getWorkflow, getWorkflowStates, getWorkflowTransitions, createWorkflowState, createWorkflowTransition, updateWorkflowState, deleteWorkflowState, updateWorkflowTransition, deleteWorkflowTransition, getWorkflowInstances, createWorkflowInstance, updateWorkflowInstance, deleteWorkflowInstance, getSlaPolicies } from '../../../lib/tmsClient'
import { Paper, Typography, List, ListItem, ListItemText, Box, Stack, TextField, Button } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

export default function WorkflowDetail({ tenantId, workflowId }: { tenantId: string; workflowId: string }) {
  const [wf, setWf] = useState<any | null>(null)
  const [states, setStates] = useState<any[]>([])
  const [transitions, setTransitions] = useState<any[]>([])
  // New: instances list
  const [instances, setInstances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // SLA policies
  const [slaPolicies, setSlaPolicies] = useState<any[]>([])

  // create state form
  const [newKey, setNewKey] = useState('')
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  // edit state form
  const [editStateId, setEditStateId] = useState<string>('')
  const [editKey, setEditKey] = useState('')
  const [editName, setEditName] = useState('')

  // create transition form
  const [trName, setTrName] = useState('')
  const [trFrom, setTrFrom] = useState('')
  const [trTo, setTrTo] = useState('')
  const [trSlaPolicyId, setTrSlaPolicyId] = useState('')
  const [trBusy, setTrBusy] = useState(false)

  // edit transition form
  const [editTrId, setEditTrId] = useState<string>('')
  const [editTrName, setEditTrName] = useState('')
  const [editTrFrom, setEditTrFrom] = useState('')
  const [editTrTo, setEditTrTo] = useState('')
  const [editTrSlaPolicyId, setEditTrSlaPolicyId] = useState('')

  // Instances dialog fields (used for both create and edit)
  const [instInitState, setInstInitState] = useState('')
  const [instBusy, setInstBusy] = useState(false)
  const [instName, setInstName] = useState('')
  const [instDescription, setInstDescription] = useState('')
  const [editingInstanceId, setEditingInstanceId] = useState<string | null>(null)

  // Dialog flags
  const [stateDialogOpen, setStateDialogOpen] = useState(false)
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false)
  const [instanceDialogOpen, setInstanceDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [w, s, t, i, sla] = await Promise.all([
          getWorkflow(tenantId, workflowId),
          getWorkflowStates(tenantId, { workflowId }),
          getWorkflowTransitions(tenantId, { workflowId }),
          getWorkflowInstances(tenantId, { workflowId }),
          getSlaPolicies(tenantId, {}),
        ])
        if (!cancelled) {
          setWf(w as any)
          setStates(s as any)
          setTransitions(t as any)
          setInstances(i as any)
          setSlaPolicies(Array.isArray(sla) ? (sla as any) : [])
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load workflow')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [tenantId, workflowId])

  async function refreshStates() {
    const s = await getWorkflowStates(tenantId, { workflowId })
    setStates(s as any)
  }
  async function refreshTransitions() {
    const t = await getWorkflowTransitions(tenantId, { workflowId })
    setTransitions(t as any)
  }
  async function refreshInstances() {
    const i = await getWorkflowInstances(tenantId, { workflowId })
    setInstances(i as any)
  }

  async function doCreateState() {
    if (!newKey || !newName || busy) return
    try {
      setBusy(true)
      await createWorkflowState(tenantId, { workflowId, key: newKey, name: newName })
      setNewKey('')
      setNewName('')
      setStateDialogOpen(false)
      await refreshStates()
    } catch (e: any) {
      alert(e?.message || 'Failed to create state')
    } finally {
      setBusy(false)
    }
  }

  async function doStartEditState(s: any) {
    setEditStateId(s.id)
    setEditKey(s.key || '')
    setEditName(s.name || '')
  }
  function cancelEditState() {
    setEditStateId('')
    setEditKey('')
    setEditName('')
  }
  async function saveEditState() {
    if (!editStateId || !editKey || !editName) return
    try {
      setBusy(true)
      await updateWorkflowState(tenantId, editStateId, { key: editKey, name: editName })
      cancelEditState()
      await refreshStates()
      await refreshTransitions() // update transition labels if state changed
    } catch (e: any) {
      alert(e?.message || 'Failed to update state')
    } finally {
      setBusy(false)
    }
  }
  async function removeState(id: string) {
    if (!id) return
    const ok = window.confirm('Delete this state? Transitions using it will also be removed.')
    if (!ok) return
    try {
      setBusy(true)
      await deleteWorkflowState(tenantId, id)
      await refreshStates()
      await refreshTransitions()
    } catch (e: any) {
      alert(e?.message || 'Failed to delete state')
    } finally {
      setBusy(false)
    }
  }

  async function doCreateTransition() {
    if (!trName || !trFrom || !trTo || trBusy) return
    try {
      setTrBusy(true)
      await createWorkflowTransition(tenantId, { workflowId, name: trName, fromStateId: trFrom, toStateId: trTo, metadata: trSlaPolicyId ? { slaPolicyId: trSlaPolicyId } : undefined })
      setTrName('')
      setTrFrom('')
      setTrTo('')
      setTrSlaPolicyId('')
      setTransitionDialogOpen(false)
      await refreshTransitions()
    } catch (e: any) {
      alert(e?.message || 'Failed to create transition')
    } finally {
      setTrBusy(false)
    }
  }

  function startEditTransition(t: any) {
    setEditTrId(t.id)
    setEditTrName(t.name || '')
    setEditTrFrom(t.fromStateId || '')
    setEditTrTo(t.toStateId || '')
    setEditTrSlaPolicyId(t?.metadata?.slaPolicyId || '')
  }
  function cancelEditTransition() {
    setEditTrId('')
    setEditTrName('')
    setEditTrFrom('')
    setEditTrTo('')
    setEditTrSlaPolicyId('')
  }
  async function saveEditTransition() {
    if (!editTrId || !editTrName || !editTrFrom || !editTrTo) return
    try {
      setTrBusy(true)
      const existing = (transitions as any[]).find(x => x.id === editTrId) || {}
      const metadata = { ...(existing.metadata || {}), ...(editTrSlaPolicyId ? { slaPolicyId: editTrSlaPolicyId } : { slaPolicyId: undefined }) }
      await updateWorkflowTransition(tenantId, editTrId, { name: editTrName, fromStateId: editTrFrom, toStateId: editTrTo, metadata })
      cancelEditTransition()
      await refreshTransitions()
    } catch (e: any) {
      alert(e?.message || 'Failed to update transition')
    } finally {
      setTrBusy(false)
    }
  }
  async function removeTransition(id: string) {
    if (!id) return
    const ok = window.confirm('Delete this transition?')
    if (!ok) return
    try {
      setTrBusy(true)
      await deleteWorkflowTransition(tenantId, id)
      await refreshTransitions()
    } catch (e: any) {
      alert(e?.message || 'Failed to delete transition')
    } finally {
      setTrBusy(false)
    }
  }

  // Instance dialog helpers
  function openCreateInstanceDialog() {
    setEditingInstanceId(null)
    setInstName('')
    setInstDescription('')
    setInstInitState('')
    setInstanceDialogOpen(true)
  }
  function openEditInstanceDialog(i: any) {
    setEditingInstanceId(i.id)
    setInstName(i.name || '')
    setInstDescription(i.description || '')
    setInstInitState(i.currentStateId || '')
    setInstanceDialogOpen(true)
  }

  async function doCreateInstance() {
    if (instBusy) return
    try {
      setInstBusy(true)
      const payload: any = { workflowId }
      if (instInitState) payload.currentStateId = instInitState
      if (instName) payload.name = instName
      if (instDescription) payload.description = instDescription
      await createWorkflowInstance(tenantId, payload)
      setInstanceDialogOpen(false)
      await refreshInstances()
    } catch (e: any) {
      alert(e?.message || 'Failed to create instance')
    } finally {
      setInstBusy(false)
    }
  }
  async function doUpdateInstance() {
    if (!editingInstanceId || instBusy) return
    try {
      setInstBusy(true)
      const payload: any = {
        currentStateId: instInitState || null,
      }
      if (instName !== undefined) payload.name = instName
      if (instDescription !== undefined) payload.description = instDescription
      await updateWorkflowInstance(tenantId, editingInstanceId, payload)
      setInstanceDialogOpen(false)
      await refreshInstances()
    } catch (e: any) {
      alert(e?.message || 'Failed to update instance')
    } finally {
      setInstBusy(false)
    }
  }
  async function removeInstance(id: string) {
    if (!id) return
    const ok = window.confirm('Delete this instance?')
    if (!ok) return
    try {
      setInstBusy(true)
      await deleteWorkflowInstance(tenantId, id)
      await refreshInstances()
    } catch (e: any) {
      alert(e?.message || 'Failed to delete instance')
    } finally {
      setInstBusy(false)
    }
  }

  if (loading) return <Typography sx={{ p: 2 }}>Loading…</Typography>
  if (error) return <Typography sx={{ p: 2 }} color="error">{error}</Typography>
  if (!wf) return <Typography sx={{ p: 2 }}>Not found</Typography>

  const stateLabel = (id?: string) => {
    const s = states.find((x: any) => x.id === id)
    return s ? `${s.key}${s.name ? ` (${s.name})` : ''}` : (id || '—')
  }
  const slaLabel = (id?: string) => {
    if (!id) return '—'
    const p = (slaPolicies as any[]).find((x: any) => x.slaPolicyId === id)
    return p ? p.name : id
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>{wf.name}</Typography>
      <Typography color="text.secondary" gutterBottom>{wf.description || '—'}</Typography>

      {/* States section */}
      <Box sx={{ mt: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>States</Typography>
          <Tooltip title="Add state"><span><IconButton size="small" color="primary" onClick={() => setStateDialogOpen(true)} disabled={busy}><AddIcon /></IconButton></span></Tooltip>
        </Stack>
        <List dense>
          {states.map((s: any) => (
            <ListItem key={s.id || s.key} disableGutters secondaryAction={
              editStateId === s.id ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button size="small" variant="contained" onClick={saveEditState} disabled={busy || !editKey || !editName}>Save</Button>
                  <Button size="small" variant="text" onClick={cancelEditState} disabled={busy}>Cancel</Button>
                </Stack>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button size="small" variant="text" onClick={() => doStartEditState(s)} disabled={busy}>Edit</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => removeState(s.id)} disabled={busy}>Delete</Button>
                </Stack>
              )
            }>
              {editStateId === s.id ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
                  <TextField size="small" label="Key" value={editKey} onChange={e => setEditKey(e.target.value)} sx={{ minWidth: 140 }} />
                  <TextField size="small" label="Name" value={editName} onChange={e => setEditName(e.target.value)} sx={{ minWidth: 200 }} />
                </Stack>
              ) : (
                <ListItemText primary={s.key} secondary={s.name} />
              )}
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Transitions section (moved to bottom) */}
      <Box sx={{ mt: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Transitions</Typography>
          <Tooltip title="Add transition"><span><IconButton size="small" color="primary" onClick={() => setTransitionDialogOpen(true)} disabled={trBusy}><AddIcon /></IconButton></span></Tooltip>
        </Stack>
        <List dense>
          {transitions.map((t: any) => (
            <ListItem key={t.id || t.name} disableGutters secondaryAction={
              editTrId === t.id ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button size="small" variant="contained" onClick={saveEditTransition} disabled={trBusy || !editTrName || !editTrFrom || !editTrTo}>Save</Button>
                  <Button size="small" variant="text" onClick={cancelEditTransition} disabled={trBusy}>Cancel</Button>
                </Stack>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button size="small" variant="text" onClick={() => startEditTransition(t)} disabled={trBusy}>Edit</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => removeTransition(t.id)} disabled={trBusy}>Delete</Button>
                </Stack>
              )
            }>
              {editTrId === t.id ? (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ width: '100%' }}>
                  <TextField size="small" label="Name" value={editTrName} onChange={e => setEditTrName(e.target.value)} sx={{ minWidth: 160 }} />
                  <Autocomplete
                    size="small"
                    options={states as any[]}
                    getOptionLabel={(opt: any) => stateLabel(opt?.id)}
                    isOptionEqualToValue={(o: any, v: any) => o?.id === v?.id}
                    value={(states as any[]).find(s => s.id === editTrFrom) || null}
                    onChange={(_, v) => setEditTrFrom(v?.id || '')}
                    renderInput={(params) => <TextField {...params} label="From state" />}
                    sx={{ minWidth: 180 }}
                  />
                  <Autocomplete
                    size="small"
                    options={states as any[]}
                    getOptionLabel={(opt: any) => stateLabel(opt?.id)}
                    isOptionEqualToValue={(o: any, v: any) => o?.id === v?.id}
                    value={(states as any[]).find(s => s.id === editTrTo) || null}
                    onChange={(_, v) => setEditTrTo(v?.id || '')}
                    renderInput={(params) => <TextField {...params} label="To state" />}
                    sx={{ minWidth: 180 }}
                  />
                  <Autocomplete
                    size="small"
                    options={slaPolicies as any[]}
                    getOptionLabel={(opt: any) => opt?.name || ''}
                    isOptionEqualToValue={(o: any, v: any) => o?.slaPolicyId === v?.slaPolicyId}
                    value={(slaPolicies as any[]).find(p => p.slaPolicyId === editTrSlaPolicyId) || null}
                    onChange={(_, v) => setEditTrSlaPolicyId(v?.slaPolicyId || '')}
                    renderInput={(params) => <TextField {...params} label="SLA policy (optional)" />}
                    sx={{ minWidth: 220 }}
                  />
                </Stack>
              ) : (
                <ListItemText primary={t.name} secondary={`${stateLabel(t.fromStateId)} → ${stateLabel(t.toStateId)}${t?.metadata?.slaPolicyId ? ` — SLA: ${slaLabel(t.metadata.slaPolicyId)}` : ''}`} />
              )}
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Instances section */}
      <Box sx={{ mt: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Instances</Typography>
          <Tooltip title="Add instance"><span><IconButton size="small" color="primary" onClick={openCreateInstanceDialog} disabled={instBusy}><AddIcon /></IconButton></span></Tooltip>
        </Stack>
        <List dense>
          {instances.map((i: any) => (
            <ListItem key={i.id} disableGutters secondaryAction={
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button size="small" variant="text" onClick={() => openEditInstanceDialog(i)} disabled={instBusy}>Edit</Button>
                <Button size="small" variant="outlined" color="error" onClick={() => removeInstance(i.id)} disabled={instBusy}>Delete</Button>
              </Stack>
            }>
              <ListItemText primary={i.name ? `${i.name} — ${i.id}` : i.id} secondary={`State: ${stateLabel(i.currentStateId)}`} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Create Instance Dialog (also used for edit) */}
      <Dialog open={instanceDialogOpen} onClose={() => setInstanceDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingInstanceId ? 'Edit Instance' : 'Create Instance'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2 }}>
          <TextField autoFocus margin="dense" label="Name (optional)" value={instName} onChange={e => setInstName(e.target.value)} fullWidth />
          <TextField margin="dense" label="Description (optional)" value={instDescription} onChange={e => setInstDescription(e.target.value)} fullWidth />
          <Autocomplete
            size="small"
            options={states as any[]}
            getOptionLabel={(opt: any) => stateLabel(opt?.id)}
            isOptionEqualToValue={(o: any, v: any) => o?.id === v?.id}
            value={(states as any[]).find(s => s.id === instInitState) || null}
            onChange={(_, v) => setInstInitState(v?.id || '')}
            renderInput={(params) => <TextField {...params} label={editingInstanceId ? 'Current state' : 'Initial state (optional)'} margin="dense" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstanceDialogOpen(false)}>Cancel</Button>
          {editingInstanceId ? (
            <Button variant="contained" onClick={doUpdateInstance} disabled={instBusy}>Save</Button>
          ) : (
            <Button variant="contained" onClick={doCreateInstance} disabled={instBusy}>Create</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Create State Dialog */}
      <Dialog open={stateDialogOpen} onClose={() => setStateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create State</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2 }}>
          <TextField autoFocus margin="dense" label="Key" value={newKey} onChange={e => setNewKey(e.target.value)} fullWidth />
          <TextField margin="dense" label="Name" value={newName} onChange={e => setNewName(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={doCreateState} disabled={!newKey || !newName || busy}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Create Transition Dialog */}
      <Dialog open={transitionDialogOpen} onClose={() => setTransitionDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Transition</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2 }}>
          <TextField autoFocus margin="dense" label="Name" value={trName} onChange={e => setTrName(e.target.value)} fullWidth />
          <Autocomplete
            size="small"
            options={states as any[]}
            getOptionLabel={(opt: any) => stateLabel(opt?.id)}
            isOptionEqualToValue={(o: any, v: any) => o?.id === v?.id}
            value={(states as any[]).find(s => s.id === trFrom) || null}
            onChange={(_, v) => setTrFrom(v?.id || '')}
            renderInput={(params) => <TextField {...params} label="From state" margin="dense" />}
          />
          <Autocomplete
            size="small"
            options={states as any[]}
            getOptionLabel={(opt: any) => stateLabel(opt?.id)}
            isOptionEqualToValue={(o: any, v: any) => o?.id === v?.id}
            value={(states as any[]).find(s => s.id === trTo) || null}
            onChange={(_, v) => setTrTo(v?.id || '')}
            renderInput={(params) => <TextField {...params} label="To state" margin="dense" />}
          />
          <Autocomplete
            size="small"
            options={slaPolicies as any[]}
            getOptionLabel={(opt: any) => opt?.name || ''}
            isOptionEqualToValue={(o: any, v: any) => o?.slaPolicyId === v?.slaPolicyId}
            value={(slaPolicies as any[]).find(p => p.slaPolicyId === trSlaPolicyId) || null}
            onChange={(_, v) => setTrSlaPolicyId(v?.slaPolicyId || '')}
            renderInput={(params) => <TextField {...params} label="SLA policy (optional)" margin="dense" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransitionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={doCreateTransition} disabled={!trName || !trFrom || !trTo || trBusy}>Create</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
