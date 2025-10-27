"use client"
import {useCallback, useEffect, useMemo, useState} from 'react'
import {Task, Workflow, WorkflowInstance} from '@/lib/types'
import {getTasks, getWorkflows, getWorkflowInstances} from '@/lib/tmsClient'
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  Button,
  TextField
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import Link from 'next/link'
import Autocomplete from '@mui/material/Autocomplete'

// Stable default order across renders
const DEFAULT_STATUS_ORDER = ['open', 'in_progress', 'approval', 'done', 'fulfilled'] as const

export default function BoardsView({ tenantId }: { tenantId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [instances, setInstances] = useState<WorkflowInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<string[]>([])
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ts, wfs, inst] = await Promise.all([
        getTasks(tenantId, {}),
        getWorkflows(tenantId),
        getWorkflowInstances(tenantId, {}),
      ])
      setTasks(Array.isArray(ts) ? (ts as any) : [])
      setWorkflows(Array.isArray(wfs) ? (wfs as any) : [])
      setInstances(Array.isArray(inst) ? (inst as any) : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load boards')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { load() }, [load])

  async function refresh() {
    setRefreshing(true)
    try { await load() } finally { setRefreshing(false) }
  }

  const instanceById = useMemo(() => {
    const m = new Map<string, WorkflowInstance>()
    instances.forEach(inst => m.set(inst.id, inst))
    return m
  }, [instances])

  // Workflows that actually appear in current tasks (via their instances)
  const workflowIdsInTasks = useMemo(() => {
    const ids = new Set<string>()
    tasks.forEach(t => {
      const iid = t.workflowInstanceId
      if (!iid) return
      const inst = instanceById.get(iid)
      if (inst?.workflowId) ids.add(inst.workflowId)
    })
    return ids
  }, [tasks, instanceById])

  const workflowOptions = useMemo(() => workflows.filter(w => workflowIdsInTasks.has(w.id)), [workflows, workflowIdsInTasks])

  // Instance options scoped by selected workflows (or all workflows if none selected), and only those used by current tasks
  const instanceIdsInTasks = useMemo(() => {
    const ids = new Set<string>()
    tasks.forEach(t => { if (t.workflowInstanceId) ids.add(t.workflowInstanceId) })
    return ids
  }, [tasks])

  const instanceOptions = useMemo(() => {
    const allowAllWf = selectedWorkflowIds.length === 0
    return instances.filter(inst => {
      if (!instanceIdsInTasks.has(inst.id)) return false
      if (!inst.workflowId) return false
      return allowAllWf || selectedWorkflowIds.includes(inst.workflowId)
    })
  }, [instances, instanceIdsInTasks, selectedWorkflowIds])

  // Display helpers
  const workflowNameById = useMemo(() => {
    const m = new Map<string, string>()
    workflows.forEach(w => m.set(w.id, w.name || w.id))
    return m
  }, [workflows])
  const instanceLabel = (inst: WorkflowInstance) => {
    const wfName = inst.workflowId ? (workflowNameById.get(inst.workflowId) || inst.workflowId) : '—'
    const iname = inst.name || inst.key || inst.id
    return `${wfName}: ${iname}`
  }

  const filteredTasks = useMemo(() => {
    let arr = tasks
    if (selectedWorkflowIds.length) {
      arr = arr.filter(t => {
        const inst = t.workflowInstanceId ? instanceById.get(t.workflowInstanceId) : undefined
        return !!(inst && inst.workflowId && selectedWorkflowIds.includes(inst.workflowId))
      })
    }
    if (selectedInstanceIds.length) {
      arr = arr.filter(t => !!t.workflowInstanceId && selectedInstanceIds.includes(t.workflowInstanceId))
    }
    return arr
  }, [tasks, selectedWorkflowIds, selectedInstanceIds, instanceById])

  const statuses = useMemo(() => {
    const set = new Set<string>()
    DEFAULT_STATUS_ORDER.forEach(s => set.add(s))
    filteredTasks.forEach(t => set.add((t.status || '').trim()))
    if (filteredTasks.some(t => !t.status)) set.add('')
    const arr = Array.from(set)
    return arr.sort((a, b) => {
      if (a === '' && b === '') return 0
      if (a === '') return 1
      if (b === '') return -1
      const ia = DEFAULT_STATUS_ORDER.indexOf(a as any)
      const ib = DEFAULT_STATUS_ORDER.indexOf(b as any)
      if (ia !== -1 || ib !== -1) return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib)
      return a.localeCompare(b)
    })
  }, [filteredTasks])

  const grouped = useMemo(() => {
    const m = new Map<string, Task[]>()
    statuses.forEach(s => m.set(s, []))
    filteredTasks.forEach(t => {
      const key = (t.status || '').trim()
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(t)
    })
    return m
  }, [filteredTasks, statuses])

  const selectedWorkflowObjects = useMemo(() => workflowOptions.filter(w => selectedWorkflowIds.includes(w.id)), [workflowOptions, selectedWorkflowIds])
  const selectedInstanceObjects = useMemo(() => instanceOptions.filter(i => selectedInstanceIds.includes(i.id)), [instanceOptions, selectedInstanceIds])

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" mb={2} spacing={1}>
        <Typography variant="h6" fontWeight={700}>Boards</Typography>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} alignItems={{ lg: 'center' }} sx={{ width: '100%', maxWidth: 800 }}>
          <Autocomplete
            multiple
            size="small"
            options={workflowOptions}
            getOptionLabel={(w) => w.name || w.id}
            value={selectedWorkflowObjects as any}
            onChange={(_, vals) => { setSelectedWorkflowIds((vals as Workflow[]).map(v => v.id)); setSelectedInstanceIds([]) }}
            renderInput={(params) => <TextField {...params} label="Filter: Workflows" placeholder="Select workflows" />}
            sx={{ flex: 1, minWidth: 240 }}
          />
          <Button size="small" variant="outlined" onClick={() => { setSelectedWorkflowIds([]); setSelectedInstanceIds([]) }} disabled={!selectedWorkflowIds.length}>Clear</Button>
          <Autocomplete
            multiple
            size="small"
            options={instanceOptions}
            getOptionLabel={(i) => instanceLabel(i)}
            value={selectedInstanceObjects as any}
            onChange={(_, vals) => setSelectedInstanceIds((vals as WorkflowInstance[]).map(v => v.id))}
            renderInput={(params) => <TextField {...params} label="Filter: Instances" placeholder="Select instances" />}
            sx={{ flex: 1, minWidth: 260 }}
          />
          <Button size="small" variant="outlined" onClick={() => setSelectedInstanceIds([])} disabled={!selectedInstanceIds.length}>Clear</Button>
          <IconButton onClick={refresh} size="small" disabled={refreshing || loading}>
            {refreshing || loading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
          </IconButton>
        </Stack>
      </Stack>

      {error && <Typography color="error" mb={2}>{error}</Typography>}

      <Box sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: `repeat(${Math.max(3, statuses.length)}, 1fr)` },
      }}>
        {statuses.map((s) => {
          const list = grouped.get(s) || []
          const label = s || 'No Status'
          return (
            <Paper key={s || 'none'} variant="outlined" sx={{ p: 1.5, minHeight: 200 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
                <Chip size="small" label={list.length} />
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <Stack spacing={1.25}>
                {list.length === 0 && <Typography variant="body2" color="text.secondary">No tasks</Typography>}
                {list.map(t => (
                  <Box key={t.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>{t.title}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip size="small" label={t.status || '—'} />
                      {/* Workflow / Instance chips for clarity */}
                      {(() => {
                        const inst = t.workflowInstanceId ? instanceById.get(t.workflowInstanceId) : undefined
                        const wfName = inst?.workflowId ? (workflows.find(w => w.id === inst.workflowId)?.name || inst.workflowId) : undefined
                        const instName = inst ? (inst.name || inst.key || inst.id) : undefined
                        return (
                          <>
                            {wfName && <Chip size="small" variant="outlined" label={`WF: ${wfName}`} />}
                            {instName && <Chip size="small" variant="outlined" label={`Instance: ${instName}`} />}
                          </>
                        )
                      })()}
                      <Typography variant="caption" color="text.secondary">Assignee: {t.assigneeId || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</Typography>
                      <Box flexGrow={1} />
                      <Button component={Link} href={`/tenant/${tenantId}/task-management/tasks/${t.id}`} size="small">Open</Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )
        })}
      </Box>
    </Paper>
  )
}