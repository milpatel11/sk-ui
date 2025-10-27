"use client";
import React from 'react';
import {Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Typography, Paper, ToggleButtonGroup, ToggleButton} from '@mui/material';
import {useParams} from 'next/navigation';
import {getWorkflows, getWorkflowInstances, getTasks} from '@/lib/tmsClient';
import {apiClient} from '@/lib/apiClient';
import dayjs, {Dayjs} from 'dayjs';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {DateTimePicker} from '@mui/x-date-pickers/DateTimePicker';

interface Workflow { id: string; name: string; description?: string }
interface WorkflowInstance { id: string; workflowId: string; currentStateId: string; taskId?: string }
interface Task { id: string; title: string; status?: string; workflowInstanceId?: string; assigneeId?: string; reporterId?: string; createdAt?: string; updatedAt?: string; dueDate?: string }
interface GlobalUser { user_id: string; username?: string; email?: string; first_name?: string; last_name?: string }

type Resolution = 'minutes' | 'hours' | 'days' | 'weeks';

export default function SequenceDiagram() {
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;

  const [loading, setLoading] = React.useState(true);
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);
  const [workflowId, setWorkflowId] = React.useState<string>('');
  const [instances, setInstances] = React.useState<WorkflowInstance[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [users, setUsers] = React.useState<GlobalUser[]>([]);
  const [svg, setSvg] = React.useState<string>('');

  const [view, setView] = React.useState<'sequence' | 'timeline'>('sequence');
  const [resolution, setResolution] = React.useState<Resolution>('days');
  const [start, setStart] = React.useState<Dayjs>(dayjs().subtract(7, 'day').startOf('day'));
  const [end, setEnd] = React.useState<Dayjs>(dayjs().endOf('day'));

  const usersById = React.useMemo(() => new Map(users.map(u => [u.user_id, u])), [users]);

  const loadAll = React.useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [wfList, userResp] = await Promise.all([
        getWorkflows(tenantId),
        apiClient.get('/users'),
      ]);
      const list = Array.isArray(wfList) ? wfList : [];
      setWorkflows(list as any);
      setUsers(Array.isArray((userResp as any).data) ? (userResp as any).data : []);
      if (list.length && !workflowId) setWorkflowId((list[0] as any).id);
    } finally {
      setLoading(false);
    }
  }, [tenantId, workflowId]);

  const loadDataForWorkflow = React.useCallback(async (wfId: string) => {
    if (!tenantId || !wfId) return;
    setLoading(true);
    try {
      const [inst, taskList] = await Promise.all([
        getWorkflowInstances(tenantId, { workflowId: wfId }),
        getTasks(tenantId, {}),
      ]);
      setInstances(Array.isArray(inst) ? (inst as any) : []);
      setTasks(Array.isArray(taskList) ? (taskList as any) : []);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => { void loadAll(); }, [loadAll]);
  React.useEffect(() => { if (workflowId) void loadDataForWorkflow(workflowId); }, [workflowId, loadDataForWorkflow]);

  const instIds = React.useMemo(() => new Set(instances.map(i => i.id)), [instances]);
  const displayName = React.useCallback((uid?: string) => {
    if (!uid) return 'Unassigned';
    const u = usersById.get(uid);
    if (!u) return uid;
    return u.username || u.email || `${u.first_name || ''} ${u.last_name || ''}`.trim() || uid;
  }, [usersById]);

  const inRange = React.useCallback((t: Task) => {
    const created = dayjs(t.createdAt || t.updatedAt || t.dueDate || undefined);
    const ended = dayjs(t.updatedAt || t.dueDate || t.createdAt || undefined);
    if (!created.isValid() && !ended.isValid()) return true; // unknown timestamps; keep
    const s = start.valueOf();
    const e = end.valueOf();
    const c = created.isValid() ? created.valueOf() : s;
    const d = ended.isValid() ? ended.valueOf() : c;
    return c <= e && d >= s;
  }, [start, end]);

  const filteredTasks = React.useMemo(() => tasks.filter(t => t.workflowInstanceId && instIds.has(t.workflowInstanceId) && inRange(t)), [tasks, instIds, inRange]);

  const sequenceDiagram = React.useMemo(() => {
    if (!workflowId) return '';
    const lines: string[] = ['sequenceDiagram'];
    const participants = new Set<string>();
    filteredTasks.forEach(t => { participants.add(displayName(t.reporterId)); participants.add(displayName(t.assigneeId)); });
    Array.from(participants).forEach(p => { const safe = p.replace(/[^A-Za-z0-9_]/g, '_'); lines.push(`participant ${safe} as ${p}`); });

    const timeFmt = resolution === 'minutes' ? 'MM/DD HH:mm' : resolution === 'hours' ? 'MM/DD HH:00' : resolution === 'days' ? 'MM/DD' : 'MM/DD';
    const ordered = [...filteredTasks].sort((a,b) => (a.createdAt||'').localeCompare(b.createdAt||''));
    ordered.forEach(t => {
      const from = displayName(t.reporterId).replace(/[^A-Za-z0-9_]/g, '_');
      const to = displayName(t.assigneeId).replace(/[^A-Za-z0-9_]/g, '_');
      const ts = dayjs(t.createdAt || t.updatedAt || undefined).isValid() ? dayjs(t.createdAt || t.updatedAt).format(timeFmt) : '';
      const label = `${ts ? `[${ts}] ` : ''}${t.title || t.id}${t.status ? ` [${t.status}]` : ''}`.replace(/\n/g, ' ');
      lines.push(`${from}->>${to}: ${label}`);
    });
    return lines.join('\n');
  }, [workflowId, filteredTasks, displayName, resolution]);

  const timelineDiagram = React.useMemo(() => {
    if (!workflowId) return '';
    const df = resolution === 'minutes' ? 'YYYY-MM-DDTHH:mm' : resolution === 'hours' ? 'YYYY-MM-DDTHH' : 'YYYY-MM-DD';
    const axis = resolution === 'minutes' ? '%m/%d %H:%M' : resolution === 'hours' ? '%m/%d %H:00' : '%m/%d';
    const sections = new Map<string, Array<{id:string; label:string; start:string; end:string}>>();
    filteredTasks.forEach(t => {
      const assignee = displayName(t.assigneeId);
      const created = dayjs(t.createdAt || t.updatedAt || start);
      const finished = dayjs(t.updatedAt || t.dueDate || created);
      let st = created.isValid() ? created : start;
      let en = finished.isValid() ? finished : st;
      if (en.isBefore(st)) en = st.add(1, resolution === 'minutes' ? 'minute' : resolution === 'hours' ? 'hour' : 'day');
      // clamp to selected range
      if (st.isBefore(start)) st = start;
      if (en.isAfter(end)) en = end;
      const list = sections.get(assignee) || [];
      list.push({ id: t.id, label: (t.title || t.id).replace(/\n/g, ' '), start: st.format(df), end: en.format(df) });
      sections.set(assignee, list);
    });
    const lines: string[] = ['gantt', `dateFormat  ${df}`, `axisFormat  ${axis}`, 'title Tasks Timeline'];
    Array.from(sections.entries()).forEach(([assignee, items]) => {
      lines.push(`section ${assignee}`);
      items.forEach(it => {
        lines.push(`${it.label} :${it.id}, ${it.start}, ${it.end}`);
      });
    });
    return lines.join('\n');
  }, [workflowId, filteredTasks, resolution, start, end, displayName]);

  const diagram = view === 'sequence' ? sequenceDiagram : timelineDiagram;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    let mounted = true;
    async function run() {
      if (!diagram) { setSvg(''); return; }
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
      try {
        const { svg } = await mermaid.render('seq-' + Date.now(), diagram);
        if (mounted) setSvg(svg);
      } catch (e) {
        if (mounted) setSvg(`<pre style="color:crimson;white-space:pre-wrap">${String(e)}</pre>`);
      }
    }
    run();
    return () => { mounted = false; };
  }, [diagram]);

  const currentWorkflow = workflows.find(w => (w as any).id === workflowId);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
          <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="sequence">Sequence</ToggleButton>
            <ToggleButton value="timeline">Timeline</ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="res-select">Resolution</InputLabel>
            <Select labelId="res-select" label="Resolution" value={resolution} onChange={e => setResolution(e.target.value as Resolution)}>
              <MenuItem value="minutes">By Minutes</MenuItem>
              <MenuItem value="hours">By Hours</MenuItem>
              <MenuItem value="days">By Days</MenuItem>
              <MenuItem value="weeks">By Weeks</MenuItem>
            </Select>
          </FormControl>
          <DateTimePicker label="Start" value={start} onChange={(v) => v && setStart(v)} slotProps={{ textField: { size: 'small' }}}/>
          <DateTimePicker label="End" value={end} onChange={(v) => v && setEnd(v)} slotProps={{ textField: { size: 'small' }}}/>
          {currentWorkflow && (
            <Typography variant="body2" color="text.secondary" sx={{flex: 1, display: { xs: 'none', md: 'block' }}}>{(currentWorkflow as any).description || ''}</Typography>
          )}
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, minHeight: 420, position: 'relative' }}>
          {loading && (
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ position: 'absolute', inset: 0 }}>
              <CircularProgress size={22} />
            </Box>
          )}
          <Box ref={containerRef} sx={{ opacity: loading ? 0.6 : 1 }} dangerouslySetInnerHTML={{ __html: svg }} />
          {!svg && !loading && (
            <Typography variant="caption" color="text.secondary">No data to display for the selected range.</Typography>
          )}
        </Paper>
      </Stack>
    </LocalizationProvider>
  );
}