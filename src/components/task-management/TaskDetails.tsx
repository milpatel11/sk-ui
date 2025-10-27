"use client"
import {useCallback, useEffect, useState} from 'react'
import {Approval, SlaTimer, Task, WorkflowInstance, WorkflowState, WorkflowTransition} from "@/lib/types";
import {
    approveApproval,
    assignTask,
    createWorkflowInstance,
    getApprovals,
    getSlaTimers,
    getTask,
    getWorkflowInstances,
    getWorkflows,
    getWorkflowStates,
    getWorkflowTransitions,
    rejectApproval,
    transitionTask,
    updateWorkflowInstance
} from "@/lib/tmsClient";
import {
    Box,
    Button,
    Chip,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import WorkflowInstancesDialog from './workflows/WorkflowInstancesDialog'

export default function TaskDetails({tenantId, taskId}: { tenantId: string; taskId: string }) {
    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Assignment
    const [assigneeId, setAssigneeId] = useState('')

    // Transition
    const [transitionTo, setTransitionTo] = useState('')
    const [reason, setReason] = useState('')

    // Approvals & SLA Timers
    const [approvals, setApprovals] = useState<Approval[]>([])
    const [timers, setTimers] = useState<SlaTimer[]>([])

    const [busy, setBusy] = useState(false)

    // Workflow Instance feature
    const [instance, setInstance] = useState<WorkflowInstance | null>(null)
    const [stateMap, setStateMap] = useState<Record<string, string>>({})

    // Create instance inline fields
    const [newWorkflowId, setNewWorkflowId] = useState('')
    const [newStateId, setNewStateId] = useState('')
    const [newInstName, setNewInstName] = useState('')
    const [newInstDescription, setNewInstDescription] = useState('')

    const [instancesOpen, setInstancesOpen] = useState(false)

    // New: workflows list and states for creation selects
    const [workflows, setWorkflows] = useState<any[]>([])
    const [createStates, setCreateStates] = useState<WorkflowState[]>([])

    // New: inline approval comments
    const [comments, setComments] = useState<Record<string, string>>({})

    // New: transitions and state lookup for current workflow
    const [transitions, setTransitions] = useState<WorkflowTransition[]>([])
    const [stateById, setStateById] = useState<Record<string, WorkflowState>>({})
    const [selectedTransitionId, setSelectedTransitionId] = useState('')

    const loadInstanceAndStates = useCallback(async (t: Task | null) => {
        setInstance(null)
        setStateMap({})
        setTransitions([])
        setStateById({})
        if (!t) return
        let list: any[] = []
        try {
            list = await getWorkflowInstances(tenantId, { taskId }) as any
        } catch {}
        if (!Array.isArray(list) || list.length === 0) {
            try { list = await getWorkflowInstances(tenantId, {}) as any } catch {}
        }
        let found: any = null
        if (Array.isArray(list)) {
            if (t.workflowInstanceId) found = list.find(i => i.id === t.workflowInstanceId) || null
            if (!found) found = list.find(i => i.taskId === taskId) || null
            if (!found && list.length > 0) found = list[0]
        }
        if (found) {
            setInstance(found as any)
            if (found.workflowId) {
                try {
                    const [states, trans] = await Promise.all([
                        getWorkflowStates(tenantId, { workflowId: found.workflowId }) as Promise<WorkflowState[]>,
                        getWorkflowTransitions(tenantId, { workflowId: found.workflowId }) as Promise<WorkflowTransition[]>,
                    ])
                    const map: Record<string, string> = {}
                    const byId: Record<string, WorkflowState> = {}
                    ;(states || []).forEach(s => { if (s.id) { byId[s.id] = s; map[s.id] = `${s.key}${s.name ? ` (${s.name})` : ''}` } })
                    setStateMap(map)
                    setStateById(byId)
                    setTransitions(Array.isArray(trans) ? trans : [])
                } catch {}
            }
        }
    }, [tenantId, taskId])

    useEffect(() => {
        let cancelled = false

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const [t, a, s, wfs] = await Promise.all([
                    getTask(tenantId, taskId),
                    getApprovals(tenantId, {taskId}),
                    getSlaTimers(tenantId, {taskId}),
                    getWorkflows(tenantId),
                ])
                if (!cancelled) {
                    setTask(t as any)
                    setApprovals(a as any)
                    setTimers(s as any)
                    setWorkflows(wfs as any)
                }
                if (!cancelled) await loadInstanceAndStates(t as any)
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Failed to load task')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [tenantId, taskId, loadInstanceAndStates])

    // Load states when newWorkflowId changes for create form
    useEffect(() => {
        let cancelled = false
        async function loadStatesForCreate() {
            setCreateStates([])
            if (!newWorkflowId) return
            try {
                const list = await getWorkflowStates(tenantId, { workflowId: newWorkflowId })
                if (!cancelled) setCreateStates(list as any)
            } catch {
                if (!cancelled) setCreateStates([])
            }
        }
        loadStatesForCreate()
        return () => { cancelled = true }
    }, [tenantId, newWorkflowId])

    async function refreshAll() {
        const [t, a, s] = await Promise.all([
            getTask(tenantId, taskId),
            getApprovals(tenantId, {taskId}),
            getSlaTimers(tenantId, {taskId}),
        ])
        setTask(t as any)
        setApprovals(a as any)
        setTimers(s as any)
        await loadInstanceAndStates(t as any)
    }

    async function doAssign() {
        if (!assigneeId || busy) return
        try {
            setBusy(true)
            await assignTask(tenantId, taskId, assigneeId)
            await refreshAll()
            setAssigneeId('')
        } finally {
            setBusy(false)
        }
    }

    async function doTransition() {
        if (busy) return
        // Determine target using selected transition or manual input fallback
        const chosen = transitions.find(tr => tr.id === selectedTransitionId)
        let toValue = ''
        if (chosen && chosen.toStateId) {
            const targetState = stateById[chosen.toStateId]
            toValue = targetState?.key || chosen.toStateId || ''
        } else {
            toValue = transitionTo
        }
        if (!toValue) return
        try {
            setBusy(true)
            await transitionTask(tenantId, taskId, toValue, reason || undefined)
            // Also move the workflow instance state if applicable
            if (chosen && instance?.id && chosen.toStateId) {
                try { await updateWorkflowInstance(tenantId, instance.id, { currentStateId: chosen.toStateId }) } catch {}
            }
            await refreshAll()
            setSelectedTransitionId('')
            setTransitionTo('')
            setReason('')
        } catch (e: any) {
            alert(e?.message || 'Transition failed')
        } finally {
            setBusy(false)
        }
    }

    async function doApprove(a: Approval) {
        if (busy) return
        try {
            setBusy(true)
            await approveApproval(tenantId, a.approvalId, { comment: comments[a.approvalId] || '' })
            await refreshAll()
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
            await refreshAll()
        } catch (e: any) {
            alert(e?.message || 'Reject failed')
        } finally {
            setBusy(false)
        }
    }

    async function doCreateInstance() {
        if (!newWorkflowId || busy) return
        try {
            setBusy(true)
            const payload: any = { workflowId: newWorkflowId, taskId }
            if (newStateId) payload.currentStateId = newStateId
            if (newInstName) payload.name = newInstName
            if (newInstDescription) payload.description = newInstDescription
            await createWorkflowInstance(tenantId, payload)
            setNewWorkflowId('')
            setNewStateId('')
            setNewInstName('')
            setNewInstDescription('')
            await refreshAll()
        } catch (e: any) {
            alert(e?.message || 'Create instance failed')
        } finally {
            setBusy(false)
        }
    }

    if (loading) return <Typography sx={{p:2}}>Loading…</Typography>
    if (error) return <Typography sx={{p:2}} color="error">{error}</Typography>
    if (!task) return <Typography sx={{p:2}}>Not found</Typography>

    const currentStateLabel = instance?.currentStateId ? (stateMap[instance.currentStateId] || instance.currentStateId) : '—'
    const isDefaultInstance = !!(task?.workflowInstanceId && instance && task.workflowInstanceId === instance.id)
    const allowedTransitions = instance?.currentStateId ? transitions.filter(tr => tr.fromStateId === instance.currentStateId) : []

    return (
        <Paper variant="outlined" sx={{p: 2, display: 'grid', gap: 2}}>
            {/* Header */}
            <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} alignItems={{sm: 'center'}} justifyContent="space-between">
                <Typography variant="h6" fontWeight={700}>{task.title}</Typography>
                <Stack direction="row" spacing={1}>
                    <Chip label={task.status || '—'} size="small"/>
                    <Chip label={task.assigneeId ? `Assignee: ${task.assigneeId}` : 'Unassigned'} size="small"/>
                    <Chip label={task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'} size="small"/>
                </Stack>
            </Stack>

            {/* Details row */}
            <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Details</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                    <Chip label={`Task: ${task.id}`} size="small" />
                    <Chip label={`Type: ${task.typeKey || '—'}`} size="small" />
                    {!!task.priority && <Chip label={`Priority: ${task.priority}`} size="small" />}
                    {!!task.slaPolicyId && <Chip label={`SLA: ${task.slaPolicyId}`} size="small" />}
                </Stack>
            </Box>

            {/* Description row */}
            <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Description</Typography>
                <Typography color="text.secondary">{task.description || '—'}</Typography>
            </Box>

            {/* Assignment row */}
            <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Assignment</Typography>
                <Stack direction={{xs: 'column', sm: 'row'}} spacing={1}>
                    <TextField size="small" label="Assignee ID" value={assigneeId} onChange={e => setAssigneeId(e.target.value)} sx={{ minWidth: 220 }} />
                    <Button variant="contained" size="small" onClick={doAssign} disabled={!assigneeId || busy}>Assign</Button>
                </Stack>
            </Box>

            {/* Transition row */}
            <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Transition</Typography>
                <Stack direction={{xs: 'column', md: 'row'}} spacing={1}>
                    {allowedTransitions.length > 0 ? (
                        <Select size="small" value={selectedTransitionId} onChange={e => setSelectedTransitionId(String(e.target.value))} displayEmpty sx={{ minWidth: 280 }}>
                            <MenuItem value=""><em>Select transition…</em></MenuItem>
                            {allowedTransitions.map(tr => {
                                const toState = tr.toStateId ? stateById[tr.toStateId] : undefined
                                const toLabel = toState ? `${toState.key}${toState.name ? ` (${toState.name})` : ''}` : (tr.toStateId || '')
                                return <MenuItem key={tr.id} value={tr.id}>{tr.name || 'Transition'} → {toLabel}</MenuItem>
                            })}
                        </Select>
                    ) : (
                        <TextField size="small" label="Transition To (state key)" value={transitionTo} onChange={e => setTransitionTo(e.target.value)} sx={{ minWidth: 280 }} />
                    )}
                    <TextField size="small" label="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} fullWidth />
                    <Button variant="outlined" size="small" onClick={doTransition} disabled={busy || (!selectedTransitionId && !transitionTo)}>Transition</Button>
                </Stack>
            </Box>

            {/* Approvals row */}
            <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Approvals</Typography>
                {approvals.length === 0 && <Typography color="text.secondary">No approvals</Typography>}
                {approvals.length > 0 && (
                    <List dense>
                        {approvals.map((a) => (
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
                                              secondary={`Approver: ${a.approverGlobalUserId || a.approverApplicationUserId || a.approverGroupId || '—'}`}/>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>

            {/* SLA Timers row */}
            <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>SLA Timers</Typography>
                {timers.length === 0 && <Typography color="text.secondary">No timers</Typography>}
                {timers.length > 0 && (
                    <List dense>
                        {timers.map((s) => (
                            <ListItem key={s.slaTimerId} disableGutters>
                                <ListItemText primary={`Timer: ${s.timerId || s.slaTimerId} — Policy: ${s.policyId}`}
                                              secondary={`Due: ${s.dueAt ? new Date(s.dueAt).toLocaleString() : '—'} — Breached: ${String(!!s.breached)}${s.breachedAt ? ` at ${new Date(s.breachedAt).toLocaleString()}` : ''}`}/>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>

            {/* Workflow Instance row */}
            <Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1} justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight={600}>Workflow Instance</Typography>
                    <Button size="small" onClick={() => setInstancesOpen(true)}>Manage instances</Button>
                </Stack>
                {instance ? (
                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={1} alignItems={{sm: 'center'}}>
                        {!!instance.name && <Chip label={`Name: ${instance.name}`} size="small"/>}
                        <Chip label={`Instance: ${instance.id}`} size="small"/>
                        {isDefaultInstance && <Chip label="Default" size="small" color="primary" variant="outlined"/>}
                        <Chip label={`Workflow: ${instance.workflowId}`} size="small"/>
                        <Chip label={`State: ${currentStateLabel}`} size="small"/>
                    </Stack>
                ) : (
                    <Stack direction={{xs: 'column', md: 'row'}} spacing={1}>
                        <TextField size="small" label="Name (optional)" value={newInstName} onChange={e => setNewInstName(e.target.value)} sx={{ minWidth: 220 }} />
                        <TextField size="small" label="Description (optional)" value={newInstDescription} onChange={e => setNewInstDescription(e.target.value)} sx={{ minWidth: 260 }} />
                        <Select size="small" value={newWorkflowId} onChange={e => setNewWorkflowId(String(e.target.value))} displayEmpty sx={{ minWidth: 240 }}>
                            <MenuItem value=""><em>Select workflow…</em></MenuItem>
                            {workflows.map((w: any) => (
                                <MenuItem key={w.id} value={w.id}>{w.name || w.id}</MenuItem>
                            ))}
                        </Select>
                        <Select size="small" value={newStateId} onChange={e => setNewStateId(String(e.target.value))} displayEmpty sx={{ minWidth: 240 }} disabled={!newWorkflowId}>
                            <MenuItem value=""><em>Initial state (optional)</em></MenuItem>
                            {createStates.map(s => (
                                <MenuItem key={s.id || s.key} value={s.id || s.key}>{s.key}{s.name ? ` (${s.name})` : ''}</MenuItem>
                            ))}
                        </Select>
                        <Button variant="contained" size="small" onClick={doCreateInstance} disabled={!newWorkflowId || busy}>Create Instance</Button>
                    </Stack>
                )}
            </Box>

            <WorkflowInstancesDialog tenantId={tenantId} taskId={taskId} open={instancesOpen} onClose={(changed) => { setInstancesOpen(false); if (changed) refreshAll() }} />
        </Paper>
    )
}