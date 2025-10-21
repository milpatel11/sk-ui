"use client";
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useParams, useRouter, useSearchParams} from 'next/navigation';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import {DataGrid, GridColDef} from '@mui/x-data-grid';
import {apiClient} from '@/lib/apiClient';
import type {SlaPolicy, SlaTimer, Task, Workflow, WorkflowInstance} from '@/lib/types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const VALID_TABS = ["dashboard", "board", "workflows", "sla", "instances"] as const;
type TaskTab = typeof VALID_TABS[number];
const STORAGE_KEY_PREFIX = 'tms:lastTab:'; // per tenant

interface TabPanelProps {
    active: TaskTab;
    me: TaskTab;
    children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({active, me, children}) => active === me ?
    <Box pt={2}>{children}</Box> : null;

export default function TaskManagementTabPage() {
    const router = useRouter();
    const params = useParams();
    const tenantId = params?.tenantId as string | undefined;
    const routeTab = params?.tab as string | undefined; // dynamic [tab] route param

    // Use route param if valid, otherwise prefer per-tenant stored last tab, fallback to 'dashboard'
    const initialTab: TaskTab = (routeTab && (VALID_TABS as readonly string[]).includes(routeTab))
        ? routeTab as TaskTab
        : (typeof window !== 'undefined' && tenantId ? (localStorage.getItem(STORAGE_KEY_PREFIX + tenantId) as TaskTab) || 'dashboard' : 'dashboard');
    const [tab, setTab] = useState<TaskTab>(initialTab);

    // Data states
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [instances, setInstances] = useState<WorkflowInstance[]>([]);
    const [slaPolicies, setSlaPolicies] = useState<SlaPolicy[]>([]);
    const [slaTimers, setSlaTimers] = useState<SlaTimer[]>([]);
    const [error, setError] = useState<string | null>(null);

    // CRUD dialog state
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const [slaDialogOpen, setSlaDialogOpen] = useState(false);
    const [editingSla, setEditingSla] = useState<SlaPolicy | null>(null);
    const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
    const [editingInstance, setEditingInstance] = useState<WorkflowInstance | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form state (simple uncontrolled via local object references)
    const [taskForm, setTaskForm] = useState({title: '', typeKey: 'issue', status: 'open', priority: 'medium'});
    const [workflowForm, setWorkflowForm] = useState({name: '', description: ''});
    const [slaForm, setSlaForm] = useState({name: '', description: '', durationSeconds: 3600});
    const [instanceForm, setInstanceForm] = useState({workflowId: '', name: '', currentStateKey: ''});

    // If invalid or missing tab in URL, redirect once to stored per-tenant tab or default 'dashboard'
    useEffect(() => {
        if (!tenantId) return;
        if (!routeTab || !(VALID_TABS as readonly string[]).includes(routeTab)) {
            const storageKey = STORAGE_KEY_PREFIX + tenantId;
            let stored: string | null = null;
            if (typeof window !== 'undefined') stored = localStorage.getItem(storageKey);
            const fallback = stored && (VALID_TABS as readonly string[]).includes(stored) ? stored : 'dashboard';
            router.replace(`/tenant/${tenantId}/task-management/${fallback}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantId, routeTab]);

    // Persist tab per tenant
    useEffect(() => {
        if (typeof window !== 'undefined' && tenantId) {
            localStorage.setItem(STORAGE_KEY_PREFIX + tenantId, tab);
        }
    }, [tab, tenantId]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [tasksR, wfR, wfiR, slaR, timersR] = await Promise.all([
                apiClient.get('/tms/tasks'),
                apiClient.get('/tms/workflows'),
                apiClient.get('/tms/workflows/instances'),
                apiClient.get('/tms/sla-policies'),
                apiClient.get('/tms/sla-timers')
            ]);
            setTasks(Array.isArray(tasksR.data) ? tasksR.data as Task[] : []);
            setWorkflows(Array.isArray(wfR.data) ? wfR.data as Workflow[] : []);
            setInstances(Array.isArray(wfiR.data) ? wfiR.data as WorkflowInstance[] : []);
            setSlaPolicies(Array.isArray(slaR.data) ? slaR.data as SlaPolicy[] : []);
            setSlaTimers(Array.isArray(timersR.data) ? timersR.data as SlaTimer[] : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load TMS data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    // If a taskId is present in the URL (query param) open that task in the board dialog
    const searchParams = useSearchParams();
    useEffect(() => {
        const taskId = searchParams?.get?.('taskId');
        if (!taskId) return;
        const found = tasks.find(t => t.id === taskId);
        if (found) {
            // switch to board tab and open editor for the task
            setTab('board');
            setEditingTask(found);
            setTaskForm({
                title: found.title || '',
                typeKey: (found as any).typeKey || 'issue',
                status: found.status || 'open',
                priority: (found as any).priority || 'medium'
            });
            setTaskDialogOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks, searchParams]);

    const changeTab = useCallback((_: React.SyntheticEvent, value: string) => {
        if (value === tab) return;
        if ((VALID_TABS as readonly string[]).includes(value)) {
            setTab(value as TaskTab);
            if (tenantId) router.replace(`/tenant/${tenantId}/task-management/${value}`);
        }
    }, [tab, tenantId, router]);

    const heading = useMemo(() => {
        switch (tab) {
            case 'board':
                return 'Board';
            case 'workflows':
                return 'Workflows';
            case 'sla':
                return 'SLA Policies';
            case 'instances':
                return 'Task Instances';
            default:
                return 'Task Management';
        }
    }, [tab]);

    // Simple safe date formatter
    const formatDate = useCallback((iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        return isNaN(d.getTime()) ? '' : d.toLocaleString();
    }, []);

    // KPI metrics derived from data
    const openTasks = tasks.filter(t => !t.status || t.status === 'open').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const breachedTimers = slaTimers.filter(st => st.breached).length;

    const workflowColumns: GridColDef[] = [
        {field: 'name', headerName: 'Name', flex: 1},
        {field: 'description', headerName: 'Description', flex: 2},
        {field: 'version', headerName: 'Ver', width: 80},
        {
            field: 'actions', headerName: '', width: 90, sortable: false, filterable: false, renderCell: params => (
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" aria-label="edit" onClick={() => {
                        const wf = workflows.find(w => w.id === params.row.id);
                        if (wf) {
                            setEditingWorkflow(wf);
                            setWorkflowForm({name: wf.name, description: wf.description || ''});
                            setWorkflowDialogOpen(true);
                        }
                    }}><EditIcon fontSize="inherit"/></IconButton>
                    <IconButton size="small" aria-label="delete"
                                onClick={() => handleDeleteWorkflow(params.row.id)}><DeleteIcon
                        fontSize="inherit"/></IconButton>
                </Stack>
            )
        }
    ];

    const slaColumns: GridColDef[] = [
        {field: 'name', headerName: 'Policy', flex: 1},
        {field: 'description', headerName: 'Description', flex: 2},
        {field: 'durationSeconds', headerName: 'Duration (s)', width: 140},
        {
            field: 'actions', headerName: '', width: 90, sortable: false, filterable: false, renderCell: params => (
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" aria-label="edit" onClick={() => {
                        const sp = slaPolicies.find(p => p.slaPolicyId === params.row.slaPolicyId || p.slaPolicyId === params.row.id);
                        if (sp) {
                            setEditingSla(sp);
                            setSlaForm({
                                name: sp.name,
                                description: sp.description || '',
                                durationSeconds: sp.durationSeconds
                            });
                            setSlaDialogOpen(true);
                        }
                    }}><EditIcon fontSize="inherit"/></IconButton>
                    <IconButton size="small" aria-label="delete"
                                onClick={() => handleDeleteSla(params.row.slaPolicyId || params.row.id)}><DeleteIcon
                        fontSize="inherit"/></IconButton>
                </Stack>
            )
        }
    ];

    const instanceColumns: GridColDef[] = [
        {field: 'name', headerName: 'Instance', flex: 1},
        {field: 'workflowId', headerName: 'Workflow', width: 160},
        {field: 'currentStateKey', headerName: 'State', width: 140},
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 170,
            valueFormatter: params => formatDate(params as string | undefined)
        },
        {
            field: 'actions', headerName: '', width: 90, sortable: false, filterable: false, renderCell: params => (
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" aria-label="edit" onClick={() => {
                        const inst = instances.find(i => i.id === params.row.id);
                        if (inst) {
                            setEditingInstance(inst);
                            setInstanceForm({
                                workflowId: inst.workflowId,
                                name: inst.name || '',
                                currentStateKey: inst.currentStateKey || ''
                            });
                            setInstanceDialogOpen(true);
                        }
                    }}><EditIcon fontSize="inherit"/></IconButton>
                    <IconButton size="small" aria-label="delete"
                                onClick={() => handleDeleteInstance(params.row.id)}><DeleteIcon
                        fontSize="inherit"/></IconButton>
                </Stack>
            )
        }
    ];

    // CRUD Handlers
    const handleSaveTask = async () => {
        setActionLoading(true);
        try {
            if (editingTask) {
                const res = await apiClient.put(`/tms/tasks/${editingTask.id}`, taskForm);
                setTasks(prev => prev.map(t => t.id === editingTask.id ? {...t, ...res.data} : t));
            } else {
                const res = await apiClient.post('/tms/tasks', taskForm);
                setTasks(prev => [...prev, res.data]);
            }
            setTaskDialogOpen(false);
            setEditingTask(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Task save failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        setActionLoading(true);
        try {
            await apiClient.delete(`/tms/tasks/${id}`);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Task delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveWorkflow = async () => {
        setActionLoading(true);
        try {
            if (editingWorkflow) {
                const res = await apiClient.put(`/tms/workflows/${editingWorkflow.id}`, workflowForm);
                setWorkflows(prev => prev.map(w => w.id === editingWorkflow.id ? {...w, ...res.data} : w));
            } else {
                const res = await apiClient.post('/tms/workflows', workflowForm);
                setWorkflows(prev => [...prev, res.data]);
            }
            setWorkflowDialogOpen(false);
            setEditingWorkflow(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Workflow save failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteWorkflow = async (id: string) => {
        setActionLoading(true);
        try {
            await apiClient.delete(`/tms/workflows/${id}`);
            setWorkflows(prev => prev.filter(w => w.id !== id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Workflow delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveSla = async () => {
        setActionLoading(true);
        try {
            if (editingSla) {
                const res = await apiClient.put(`/tms/sla-policies/${editingSla.slaPolicyId}`, slaForm);
                setSlaPolicies(prev => prev.map(p => p.slaPolicyId === editingSla.slaPolicyId ? {...p, ...res.data} : p));
            } else {
                const res = await apiClient.post('/tms/sla-policies', slaForm);
                setSlaPolicies(prev => [...prev, res.data]);
            }
            setSlaDialogOpen(false);
            setEditingSla(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'SLA save failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSla = async (id: string) => {
        setActionLoading(true);
        try {
            await apiClient.delete(`/tms/sla-policies/${id}`);
            setSlaPolicies(prev => prev.filter(p => p.slaPolicyId !== id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'SLA delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveInstance = async () => {
        setActionLoading(true);
        try {
            if (editingInstance) {
                const res = await apiClient.put(`/tms/workflows/instances/${editingInstance.id}`, instanceForm);
                setInstances(prev => prev.map(i => i.id === editingInstance.id ? {...i, ...res.data} : i));
            } else {
                const res = await apiClient.post('/tms/workflows/instances', instanceForm);
                setInstances(prev => [...prev, res.data]);
            }
            setInstanceDialogOpen(false);
            setEditingInstance(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Instance save failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteInstance = async (id: string) => {
        setActionLoading(true);
        try {
            await apiClient.delete(`/tms/workflows/instances/${id}`);
            setInstances(prev => prev.filter(i => i.id !== id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Instance delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    // Generic dialog close helper used for all entity types to avoid repeated comma-expression handlers
    const handleDialogClose = useCallback((setOpen: React.Dispatch<React.SetStateAction<boolean>>, setEditing: React.Dispatch<React.SetStateAction<any | null>>) => {
        if (!actionLoading) {
            setOpen(false);
            setEditing(null);
        }
    }, [actionLoading]);

    return (
        <Box maxWidth={1400} mx="auto" px={{xs: 1, sm: 2, md: 3}}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h5" fontWeight={700}>{heading}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={`Open ${openTasks}`} color="primary" size="small"/>
                    <Chip label={`In progress ${inProgress}`} color="warning" size="small"/>
                    <Chip label={`Done ${doneTasks}`} color="success" size="small"/>
                    <Chip label={`SLA breaches ${breachedTimers}`} color="error" size="small"/>
                </Stack>
            </Box>
            <Paper elevation={1} variant="outlined" sx={{p: 1, borderRadius: 2, mb: 2, bgcolor: 'background.paper'}}>
                <Tabs
                    value={tab}
                    onChange={changeTab}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    sx={{
                        '& .MuiTab-root': {textTransform: 'none', fontWeight: 300, minHeight: 44},
                        '& .MuiTabs-indicator': {height: 4, borderRadius: 2, bgcolor: 'primary.main'},
                        px: 1
                    }}
                >
                    <Tab label="Board" value="board"/>
                    <Tab label="Workflows" value="workflows"/>
                    <Tab label="SLA" value="sla"/>
                    <Tab label="Instances" value="instances"/>
                </Tabs>
                <Divider sx={{mb: 2}}/>
                {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}
                {loading && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CircularProgress size={20}/>
                        <Typography variant="caption" color="text.secondary">Loading data…</Typography>
                    </Box>
                )}

                <TabPanel active={tab} me="board">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2" color="text.secondary">Lightweight status lanes.</Typography>
                        <Button size="small" variant="contained" onClick={() => {
                            setEditingTask(null);
                            setTaskForm({title: '', typeKey: 'issue', status: 'open', priority: 'medium'});
                            setTaskDialogOpen(true);
                        }}>New Task</Button>
                    </Stack>
                    <Stack direction="row" gap={2} alignItems="flex-start" flexWrap="wrap">
                        {['open', 'in_progress', 'done'].map(s => (
                            <Paper key={s} variant="outlined" sx={{p: 1.5, width: 260, minHeight: 200}}>
                                <Typography variant="subtitle2" gutterBottom>{s.replace('_', ' ')}</Typography>
                                <Stack spacing={1}>
                                    {tasks.filter(t => (t.status || 'open') === s).map(t => (
                                        <Paper key={t.id} variant="outlined"
                                               sx={{p: 1, bgcolor: 'background.default', position: 'relative'}}>
                                            <Typography variant="p" >{t.title}</Typography>
                                            <Typography variant="caption" display="block"
                                                        color="text.secondary">{t.priority}</Typography>
                                            <Stack direction="row" spacing={0.5} mt={0.5}>
                                                <IconButton size="small" aria-label="edit-task" onClick={() => {
                                                    setEditingTask(t);
                                                    setTaskForm({
                                                        title: t.title,
                                                        typeKey: t.typeKey,
                                                        status: t.status || 'open',
                                                        priority: t.priority || 'medium'
                                                    });
                                                    setTaskDialogOpen(true);
                                                }}>
                                                    <EditIcon fontSize="inherit"/>
                                                </IconButton>
                                                <IconButton size="small" aria-label="delete-task"
                                                            onClick={() => handleDeleteTask(t.id)}>
                                                    <DeleteIcon fontSize="inherit"/>
                                                </IconButton>
                                            </Stack>
                                        </Paper>
                                    ))}
                                    {tasks.filter(t => (t.status || 'open') === s).length === 0 &&
                                        <Typography variant="caption" color="text.secondary">None</Typography>}
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                </TabPanel>
                <TabPanel active={tab} me="workflows">
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="body2" color="text.secondary">Configured workflows</Typography>
                            <Button size="small" variant="contained" onClick={() => {
                                setEditingWorkflow(null);
                                setWorkflowForm({name: '', description: ''});
                                setWorkflowDialogOpen(true);
                            }}>New Workflow</Button>
                        </Stack>
                        <div style={{width: '100%'}}>
                            <DataGrid
                                rows={workflows}
                                columns={workflowColumns}
                                disableRowSelectionOnClick
                                autoHeight
                                density="compact"
                                sx={{
                                    borderRadius: 2,
                                    '& .MuiDataGrid-cell': {py: 1},
                                    '& .MuiDataGrid-columnHeaders': {background: 'grey.50'}
                                }}
                                paginationModel={{pageSize: 5, page: 0}}
                                pageSizeOptions={[5, 10]}
                            />
                        </div>
                    </Box>
                </TabPanel>
                <TabPanel active={tab} me="sla">
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="body2" color="text.secondary">SLA policies</Typography>
                            <Button size="small" variant="contained" onClick={() => {
                                setEditingSla(null);
                                setSlaForm({name: '', description: '', durationSeconds: 3600});
                                setSlaDialogOpen(true);
                            }}>New Policy</Button>
                        </Stack>
                        <div style={{width: '100%'}}>
                            <DataGrid
                                rows={slaPolicies.map(p => ({id: p.slaPolicyId, ...p}))}
                                columns={slaColumns}
                                disableRowSelectionOnClick
                                autoHeight
                                density="compact"
                                sx={{borderRadius: 2, '& .MuiDataGrid-cell': {py: 1}}}
                                paginationModel={{pageSize: 5, page: 0}}
                                pageSizeOptions={[5, 10]}
                            />
                        </div>
                    </Box>
                </TabPanel>
                <TabPanel active={tab} me="instances">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2" color="text.secondary">Workflow instances</Typography>
                        <Button size="small" variant="contained" onClick={() => {
                            setEditingInstance(null);
                            setInstanceForm({workflowId: workflows[0]?.id || '', name: '', currentStateKey: ''});
                            setInstanceDialogOpen(true);
                        }}>New Instance</Button>
                    </Stack>
                    <div style={{width: '100%'}}>
                        <DataGrid
                            rows={instances}
                            columns={instanceColumns}
                            disableRowSelectionOnClick
                            autoHeight
                            density="compact"
                            sx={{borderRadius: 2, '& .MuiDataGrid-cell': {py: 1}}}
                            paginationModel={{pageSize: 10, page: 0}}
                            pageSizeOptions={[5, 10, 20]}
                        />
                    </div>
                </TabPanel>
            </Paper>
            {/* Dialogs */}
            <Dialog open={taskDialogOpen}
                    onClose={() => handleDialogClose(setTaskDialogOpen, setEditingTask)} fullWidth
                    PaperProps={{sx: {borderRadius: 2, maxWidth: 600}}}>
                <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                    <TextField label="Title" value={taskForm.title}
                               onChange={e => setTaskForm(f => ({...f, title: e.target.value}))} fullWidth/>
                    <TextField label="Type Key" value={taskForm.typeKey}
                               onChange={e => setTaskForm(f => ({...f, typeKey: e.target.value}))} fullWidth/>
                    <TextField label="Status" value={taskForm.status}
                               onChange={e => setTaskForm(f => ({...f, status: e.target.value}))} fullWidth/>
                    <TextField label="Priority" value={taskForm.priority}
                               onChange={e => setTaskForm(f => ({...f, priority: e.target.value}))} fullWidth/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setTaskDialogOpen(false);
                        setEditingTask(null);
                    }} disabled={actionLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveTask}
                            disabled={actionLoading || !taskForm.title}>{editingTask ? 'Save' : 'Create'}</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={workflowDialogOpen}
                    onClose={() => handleDialogClose(setWorkflowDialogOpen, setEditingWorkflow)} fullWidth
                    PaperProps={{sx: {borderRadius: 2, maxWidth: 600}}}>
                <DialogTitle>{editingWorkflow ? 'Edit Workflow' : 'New Workflow'}</DialogTitle>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                    <TextField label="Name" value={workflowForm.name}
                               onChange={e => setWorkflowForm(f => ({...f, name: e.target.value}))} fullWidth/>
                    <TextField label="Description" value={workflowForm.description}
                               onChange={e => setWorkflowForm(f => ({...f, description: e.target.value}))} fullWidth
                               multiline minRows={2}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setWorkflowDialogOpen(false);
                        setEditingWorkflow(null);
                    }} disabled={actionLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveWorkflow}
                            disabled={actionLoading || !workflowForm.name}>{editingWorkflow ? 'Save' : 'Create'}</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={slaDialogOpen}
                    onClose={() => handleDialogClose(setSlaDialogOpen, setEditingSla)} fullWidth
                    PaperProps={{sx: {borderRadius: 2, maxWidth: 600}}}>
                <DialogTitle>{editingSla ? 'Edit SLA Policy' : 'New SLA Policy'}</DialogTitle>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                    <TextField label="Name" value={slaForm.name}
                               onChange={e => setSlaForm(f => ({...f, name: e.target.value}))} fullWidth/>
                    <TextField label="Description" value={slaForm.description}
                               onChange={e => setSlaForm(f => ({...f, description: e.target.value}))} fullWidth/>
                    <TextField label="Duration Seconds" type="number" value={slaForm.durationSeconds}
                               onChange={e => setSlaForm(f => ({...f, durationSeconds: Number(e.target.value) || 0}))}
                               fullWidth/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setSlaDialogOpen(false);
                        setEditingSla(null);
                    }} disabled={actionLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveSla}
                            disabled={actionLoading || !slaForm.name || slaForm.durationSeconds <= 0}>{editingSla ? 'Save' : 'Create'}</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={instanceDialogOpen}
                    onClose={() => handleDialogClose(setInstanceDialogOpen, setEditingInstance)} fullWidth
                    PaperProps={{sx: {borderRadius: 2, maxWidth: 600}}}>
                <DialogTitle>{editingInstance ? 'Edit Workflow Instance' : 'New Workflow Instance'}</DialogTitle>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                    <TextField label="Workflow ID" value={instanceForm.workflowId}
                               onChange={e => setInstanceForm(f => ({...f, workflowId: e.target.value}))} fullWidth/>
                    <TextField label="Name" value={instanceForm.name}
                               onChange={e => setInstanceForm(f => ({...f, name: e.target.value}))} fullWidth/>
                    <TextField label="Current State Key" value={instanceForm.currentStateKey}
                               onChange={e => setInstanceForm(f => ({...f, currentStateKey: e.target.value}))}
                               fullWidth/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setInstanceDialogOpen(false);
                        setEditingInstance(null);
                    }} disabled={actionLoading}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveInstance}
                            disabled={actionLoading || !instanceForm.workflowId}>{editingInstance ? 'Save' : 'Create'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}