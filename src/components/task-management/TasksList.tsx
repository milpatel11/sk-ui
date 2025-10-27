"use client"
import {getTasks} from '@/lib/tmsClient'
import {useEffect, useMemo, useState} from 'react'
import {Task} from "@/lib/types";
import {
    Box,
    Button,
    Chip,
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
import Link from 'next/link'
import ApprovalsDialog from './approvals/ApprovalsDialog'
import WorkflowInstancesDialog from './workflows/WorkflowInstancesDialog'

export default function TasksList({tenantId}: { tenantId: string }) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<{ status?: string; assigneeId?: string; type_key?: string }>({})

    const [approvalsOpen, setApprovalsOpen] = useState(false)
    const [instancesOpen, setInstancesOpen] = useState(false)
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        getTasks(tenantId, filters)
            .then((data) => {
                if (!cancelled) setTasks(data as any)
            })
            .catch((e) => {
                if (!cancelled) setError(e?.message || 'Failed to load tasks')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [tenantId, filters])

    const rows = useMemo(() => tasks, [tasks])

    return (
        <Paper variant="outlined" sx={{p: 2}}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={700}>Tasks</Typography>
            </Stack>

            <Stack direction={{xs: 'column', sm: 'row'}} spacing={1} useFlexGap flexWrap="wrap" mb={2}>
                <TextField size="small" label="Status" value={filters.status || ''}
                           onChange={(e) => setFilters(f => ({...f, status: e.target.value || undefined}))}/>
                <TextField size="small" label="Assignee ID" value={filters.assigneeId || ''}
                           onChange={(e) => setFilters(f => ({...f, assigneeId: e.target.value || undefined}))}/>
                <TextField size="small" label="Type Key" value={filters.type_key || ''}
                           onChange={(e) => setFilters(f => ({...f, type_key: e.target.value || undefined}))}/>
                <Box flexGrow={1}/>
                <Button variant="outlined" size="small" onClick={() => setFilters({})}>Clear</Button>
            </Stack>

            {loading && <Typography color="text.secondary">Loading…</Typography>}
            {error && <Typography color="error">{error}</Typography>}

            {!loading && !error && (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Assignee</TableCell>
                                <TableCell>Due</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {rows.map(t => (
                            <TableRow key={t.id} hover>
                                <TableCell>{t.title}</TableCell>
                                <TableCell>
                                    {t.status ? <Chip size="small" label={t.status} /> : <Chip size="small" label="—" variant="outlined"/>}
                                </TableCell>
                                <TableCell>{t.assigneeId || '—'}</TableCell>
                                <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleString() : '—'}</TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button component={Link} href={`/tenant/${tenantId}/task-management/tasks/${t.id}`} size="small">Open</Button>
                                        <Button size="small" onClick={() => { setActiveTaskId(t.id); setApprovalsOpen(true) }}>Approvals</Button>
                                        <Button size="small" onClick={() => { setActiveTaskId(t.id); setInstancesOpen(true) }}>Instances</Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ApprovalsDialog tenantId={tenantId} taskId={activeTaskId} open={approvalsOpen} onClose={() => setApprovalsOpen(false)} />
            <WorkflowInstancesDialog tenantId={tenantId} taskId={activeTaskId} open={instancesOpen} onClose={() => setInstancesOpen(false)} />
        </Paper>
    )
}