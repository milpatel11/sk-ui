"use client";
import React from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Typography, Paper, List, ListItem, ListItemText, Chip} from '@mui/material';
import {useParams} from 'next/navigation';
import {getWorkflows, getWorkflowStates, getWorkflowTransitions, getWorkflowInstances, getTasks} from '@/lib/tmsClient';

interface Workflow { id: string; name: string; description?: string }
interface WorkflowState { id: string; workflowId: string; key: string; name: string }
interface WorkflowTransition { id: string; workflowId: string; name: string; fromStateId: string; toStateId: string }
interface WorkflowInstance { id: string; workflowId: string; currentStateId: string; taskId?: string }
interface Task { id: string; title: string; status?: string; workflowInstanceId?: string; assigneeId?: string; reporterId?: string }

export default function FlowCanvas() {
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;

  const [loading, setLoading] = React.useState(true);
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);
  const [workflowId, setWorkflowId] = React.useState<string>('');
  const [states, setStates] = React.useState<WorkflowState[]>([]);
  const [transitions, setTransitions] = React.useState<WorkflowTransition[]>([]);
  const [instances, setInstances] = React.useState<WorkflowInstance[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [selectedStateId, setSelectedStateId] = React.useState<string | null>(null);

  const loadWorkflows = React.useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const list = await getWorkflows(tenantId);
      const wfList = Array.isArray(list) ? list : [];
      setWorkflows(wfList as any);
      if (wfList.length && !workflowId) setWorkflowId((wfList[0] as any).id);
    } finally {
      setLoading(false);
    }
  }, [tenantId, workflowId]);

  const loadGraph = React.useCallback(async (wfId: string) => {
    if (!tenantId || !wfId) return;
    setLoading(true);
    try {
      const [st, tr, inst, taskList] = await Promise.all([
        getWorkflowStates(tenantId, { workflowId: wfId }),
        getWorkflowTransitions(tenantId, { workflowId: wfId }),
        getWorkflowInstances(tenantId, { workflowId: wfId }),
        getTasks(tenantId, {}),
      ]);
      setStates(Array.isArray(st) ? (st as any) : []);
      setTransitions(Array.isArray(tr) ? (tr as any) : []);
      setInstances(Array.isArray(inst) ? (inst as any) : []);
      setTasks(Array.isArray(taskList) ? (taskList as any) : []);
      setSelectedStateId(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => { void loadWorkflows(); }, [loadWorkflows]);
  React.useEffect(() => { if (workflowId) void loadGraph(workflowId); }, [workflowId, loadGraph]);

  // Build mapping of stateId -> tasks in that state via instances
  const tasksByStateId = React.useMemo(() => {
    const map = new Map<string, Task[]>();
    // map workflow instance id -> currentStateId
    const instById = new Map(instances.map(i => [i.id, i.currentStateId] as const));
    tasks.forEach(t => {
      const sid = t.workflowInstanceId ? instById.get(t.workflowInstanceId) : null;
      if (sid) {
        const arr = map.get(sid) || [];
        arr.push(t);
        map.set(sid, arr);
      }
    });
    return map;
  }, [instances, tasks]);

  // Horizontal layout
  const nodes = React.useMemo(() => {
    const spacingX = 220; const y = 120;
    return states.map((s, idx) => {
      const count = tasksByStateId.get(s.id)?.length || 0;
      return ({
        id: s.id,
        position: { x: 40 + idx * spacingX, y },
        data: { label: `${s.name || s.key}${count ? ` (${count})` : ''}` },
        style: { padding: 12, borderRadius: 8 }
      });
    });
  }, [states, tasksByStateId]);

  const edges = React.useMemo(() => {
    return transitions.map(t => ({
      id: t.id,
      source: t.fromStateId,
      target: t.toStateId,
      label: t.name,
      animated: true,
      style: { strokeWidth: 2 }
    }));
  }, [transitions]);

  const currentWorkflow = workflows.find(w => (w as any).id === workflowId);

  const onNodeClick = React.useCallback((_: any, node: any) => {
    setSelectedStateId(node?.id || null);
  }, []);

  const selectedTasks = React.useMemo(() => selectedStateId ? (tasksByStateId.get(selectedStateId) || []) : [], [selectedStateId, tasksByStateId]);
  const selectedState = React.useMemo(() => states.find(s => s.id === selectedStateId) || null, [selectedStateId, states]);

  return (
    <Stack spacing={1} sx={{height: '100%'}}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="wf-select">Workflow</InputLabel>
          <Select labelId="wf-select" label="Workflow" value={workflowId} onChange={e => setWorkflowId(e.target.value)}>
            {workflows.map(w => (
              <MenuItem key={(w as any).id} value={(w as any).id}>{(w as any).name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {currentWorkflow && (
          <Typography variant="body2" color="text.secondary" sx={{flex: 1}}>{(currentWorkflow as any).description || ''}</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 420 }}>
        <Box sx={{ position: 'relative', flex: 1 }}>
          {loading && (
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
              <CircularProgress size={22} />
            </Box>
          )}
          <Box sx={{ width: '100%', height: '100%', opacity: loading ? 0.6 : 1 }}>
            <ReactFlow nodes={nodes as any} edges={edges as any} fitView onNodeClick={onNodeClick}>
              <Background />
              <MiniMap />
              <Controls />
            </ReactFlow>
          </Box>
        </Box>

        <Paper variant="outlined" sx={{ width: 360, p: 1.5, display: { xs: 'none', md: 'block' } }}>
          <Typography variant="subtitle2" gutterBottom>
            {selectedState ? `Tasks in “${selectedState.name || selectedState.key}”` : 'Select a state'}
          </Typography>
          {selectedState ? (
            selectedTasks.length ? (
              <List dense>
                {selectedTasks.map(t => (
                  <ListItem key={t.id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemText
                      primary={t.title || t.id}
                      secondary={
                        <span>
                          <Chip component="span" size="small" label={t.status || 'n/a'} sx={{ mr: 0.5 }} />
                          {t.assigneeId ? <span>Assignee: {t.assigneeId}</span> : <span>Unassigned</span>}
                        </span>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="caption" color="text.secondary">No tasks in this state.</Typography>
            )
          ) : (
            <Typography variant="caption" color="text.secondary">Click a state node to see tasks.</Typography>
          )}
        </Paper>
      </Stack>
    </Stack>
  );
}