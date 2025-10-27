"use client"
import {createSlaPolicy, getSlaPolicies} from '@/lib/tmsClient'
import {useEffect, useState} from 'react'
import {Button, List, ListItem, ListItemText, Paper, Stack, TextField, Typography} from '@mui/material'

export default function SlaPolicyList({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [targetHours, setTargetHours] = useState<number>(24)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSlaPolicies(tenantId, {})
      .then((data)=>{ if(!cancelled) setItems(data as any) })
      .catch((e)=>{ if(!cancelled) setError(e?.message || 'Failed to load policies') })
      .finally(()=>{ if(!cancelled) setLoading(false) })
    return ()=>{ cancelled = true }
  }, [tenantId])

  async function create() {
    const dto = { name, targetHours }
    const created = await createSlaPolicy(tenantId, dto)
    setItems((prev)=>[created, ...prev])
    setName('')
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>SLA Policies</Typography>
      <Stack direction={{xs: 'column', sm: 'row'}} spacing={1} useFlexGap flexWrap="wrap" mb={2}>
        <TextField size="small" label="Name" value={name} onChange={e=>setName(e.target.value)} />
        <TextField size="small" label="Target Hours" type="number" value={targetHours} onChange={e=>setTargetHours(Number(e.target.value))} />
        <Button variant="contained" size="small" onClick={create} disabled={!name}>Create</Button>
      </Stack>
      {loading && <Typography color="text.secondary">Loading…</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && (
        <List>
          {items.map(p => (
            <ListItem key={p.slaPolicyId} disableGutters>
              <ListItemText primary={p.name} secondary={`${p.targetHours}h target`} />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  )
}