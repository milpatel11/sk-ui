"use client"
import {useState} from 'react'
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField} from '@mui/material'
import {createWorkflow} from '@/lib/tmsClient'

export default function WorkflowCreateDialog({ tenantId, open, onClose }: { tenantId: string; open: boolean; onClose: (created?: boolean) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleCreate() {
    if (!name || busy) return
    try {
      setBusy(true)
      await createWorkflow(tenantId, { name, description: description || undefined })
      setName('')
      setDescription('')
      onClose(true)
    } catch (e: any) {
      alert(e?.message || 'Failed to create workflow')
    } finally {
      setBusy(false)
    }
  }

  function handleClose() {
    setName('')
    setDescription('')
    onClose(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>New Workflow</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField autoFocus required label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth size="small" />
          <TextField label="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} fullWidth size="small" multiline minRows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleCreate} variant="contained" disabled={!name || busy}>Create</Button>
      </DialogActions>
    </Dialog>
  )
}
