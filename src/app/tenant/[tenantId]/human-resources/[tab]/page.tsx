"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Box, Tabs, Tab, Typography, Paper, Divider, Stack, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const VALID_TABS = ["attendance","shifts","vacations","availability"] as const;
type HrTab = typeof VALID_TABS[number];

interface MeResp { user_id: string; }
interface AttendanceRec { id: string; userId: string; clockInAt: string; clockOutAt?: string | null; durationMinutes?: number; notes?: string }
interface ShiftRec { id: string; userId: string; start: string; end: string; role?: string; location?: string; status?: string }
interface VacationRec { id: string; userId: string; startDate: string; endDate: string; reason?: string; status: string }
interface AvailabilityRec { id: string; userId: string; start: string; end: string; notes?: string }

interface TabPanelProps { active: HrTab; me: HrTab; children: React.ReactNode; }
const TabPanel: React.FC<TabPanelProps> = ({ active, me, children }) => active === me ? <Box pt={2}>{children}</Box> : null;

export default function HumanResourcesTabPage(){
  const pathname = usePathname(); // /tenant/{tenantId}/human-resources/{tab}
  const router = useRouter();
  const parts = pathname.split('/').filter(Boolean); // ['tenant','{tenantId}','human-resources','{tab}']
  const tenantId = parts[1];
  const routeTab = parts[3] as string | undefined;
  const initialTab: HrTab = (routeTab && (VALID_TABS as readonly string[]).includes(routeTab)) ? routeTab as HrTab : 'attendance';
  const [tab, setTab] = useState<HrTab>(initialTab);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [me, setMe] = useState<MeResp | null>(null);

  const [attendance, setAttendance] = useState<AttendanceRec[]>([]);
  const [shifts, setShifts] = useState<ShiftRec[]>([]);
  const [vacations, setVacations] = useState<VacationRec[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRec[]>([]);

  const userId = me?.user_id ?? null;
  const openAttendance = useMemo(() => attendance.find(a => !a.clockOutAt) || null, [attendance]);

  // Normalize URL to a valid tab
  useEffect(()=>{
    if(!routeTab || !(VALID_TABS as readonly string[]).includes(routeTab)){
      router.replace(`/tenant/${tenantId}/human-resources/attendance`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const load = useCallback(async ()=>{
    setLoading(true); setError(null);
    try {
      const meR = await apiClient.get('/me');
      const meData: MeResp | null = meR.data ?? null;
      setMe(meData);
      const uid = meData?.user_id;
      if (!uid) { setLoading(false); return; }
      const [att, sh, vac, av] = await Promise.all([
        apiClient.get(`/hr/attendance?userId=${uid}`),
        apiClient.get(`/hr/shifts?userId=${uid}`),
        apiClient.get(`/hr/vacations?userId=${uid}`),
        apiClient.get(`/hr/availability?userId=${uid}`)
      ]);
      setAttendance(Array.isArray(att.data)? att.data:[]);
      setShifts(Array.isArray(sh.data)? sh.data:[]);
      setVacations(Array.isArray(vac.data)? vac.data:[]);
      setAvailability(Array.isArray(av.data)? av.data:[]);
    } catch(e:any){ setError(e?.message || 'Failed to load HR'); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ void load(); },[load]);

  const changeTab = useCallback((_:React.SyntheticEvent, value:string)=>{
    if(value===tab) return;
    if((VALID_TABS as readonly string[]).includes(value)){
      setTab(value as HrTab);
      router.replace(`/tenant/${tenantId}/human-resources/${value}`);
    }
  },[tab, tenantId, router]);

  // Actions
  const onClockIn = async () => {
    if (!userId) return; setError(null);
    try {
      const res = await apiClient.post('/hr/attendance/clock-in', { userId });
      setAttendance(prev => [res.data as AttendanceRec, ...prev]);
    } catch(e:any){ setError(e?.message || 'Clock-in failed'); }
  };
  const onClockOut = async () => {
    if (!userId) return; setError(null);
    try {
      const res = await apiClient.post('/hr/attendance/clock-out', { userId });
      const rec = res.data as AttendanceRec;
      setAttendance(prev => prev.map(r => r.id === rec.id ? rec : r));
    } catch(e:any){ setError(e?.message || 'Clock-out failed'); }
  };

  // Dialogs/forms
  const [shiftDlg, setShiftDlg] = useState(false);
  const [shiftForm, setShiftForm] = useState({ start:'', end:'', role:'', location:'' });
  const saveShift = async () => {
    if (!userId || !shiftForm.start || !shiftForm.end) return; setError(null);
    try { const res = await apiClient.post('/hr/shifts', { userId, ...shiftForm }); setShifts(prev=> [res.data as ShiftRec, ...prev]); setShiftForm({ start:'', end:'', role:'', location:'' }); setShiftDlg(false); }
    catch(e:any){ setError(e?.message || 'Failed to create shift'); }
  };
  const deleteShift = async (id:string) => {
    try { await apiClient.delete(`/hr/shifts/${id}`); setShifts(prev=> prev.filter(s=> s.id!==id)); }
    catch(e:any){ setError(e?.message || 'Delete failed'); }
  };

  const [vacDlg, setVacDlg] = useState(false);
  const [vacForm, setVacForm] = useState({ startDate:'', endDate:'', reason:'' });
  const saveVacation = async () => {
    if (!userId || !vacForm.startDate || !vacForm.endDate) return; setError(null);
    try { const res = await apiClient.post('/hr/vacations', { userId, ...vacForm }); setVacations(prev=> [res.data as VacationRec, ...prev]); setVacForm({ startDate:'', endDate:'', reason:'' }); setVacDlg(false); }
    catch(e:any){ setError(e?.message || 'Failed to request vacation'); }
  };
  const deleteVacation = async (id:string) => {
    try { await apiClient.delete(`/hr/vacations/${id}`); setVacations(prev=> prev.filter(v=> v.id!==id)); }
    catch(e:any){ setError(e?.message || 'Delete failed'); }
  };

  const [availDlg, setAvailDlg] = useState(false);
  const [availForm, setAvailForm] = useState({ start:'', end:'', notes:'' });
  const saveAvailability = async () => {
    if (!userId || !availForm.start || !availForm.end) return; setError(null);
    try { const res = await apiClient.post('/hr/availability', { userId, ...availForm }); setAvailability(prev=> [res.data as AvailabilityRec, ...prev]); setAvailForm({ start:'', end:'', notes:'' }); setAvailDlg(false); }
    catch(e:any){ setError(e?.message || 'Failed to add availability'); }
  };
  const deleteAvailability = async (id:string) => {
    try { await apiClient.delete(`/hr/availability/${id}`); setAvailability(prev=> prev.filter(a=> a.id!==id)); }
    catch(e:any){ setError(e?.message || 'Delete failed'); }
  };

  // Columns
  const attendanceCols: GridColDef[] = [
    { field:'clockInAt', headerName:'Clock In', width:190, valueFormatter:p=> p.value ? new Date(p.value as string).toLocaleString():'' },
    { field:'clockOutAt', headerName:'Clock Out', width:190, valueFormatter:p=> p.value ? new Date(p.value as string).toLocaleString():'' },
    { field:'durationMinutes', headerName:'Minutes', width:100 },
    { field:'notes', headerName:'Notes', flex:1 }
  ];
  const shiftCols: GridColDef[] = [
    { field:'start', headerName:'Start', width:190, valueFormatter:p=> p.value ? new Date(p.value as string).toLocaleString():'' },
    { field:'end', headerName:'End', width:190, valueFormatter:p=> p.value ? new Date(p.value as string).toLocaleString():'' },
    { field:'role', headerName:'Role', width:160 },
    { field:'location', headerName:'Location', width:160 },
    { field:'status', headerName:'Status', width:120 },
    { field:'actions', headerName:'', width:80, sortable:false, filterable:false, renderCell: params => (
      <IconButton size="small" aria-label="delete" onClick={()=> deleteShift(params.row.id)}>
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    )}
  ];
  const vacationCols: GridColDef[] = [
    { field:'startDate', headerName:'From', width:150 },
    { field:'endDate', headerName:'To', width:150 },
    { field:'reason', headerName:'Reason', flex:1 },
    { field:'status', headerName:'Status', width:120 },
    { field:'actions', headerName:'', width:80, sortable:false, filterable:false, renderCell: params => (
      <IconButton size="small" aria-label="delete" onClick={()=> deleteVacation(params.row.id)}>
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    )}
  ];
  const availabilityCols: GridColDef[] = [
    { field:'start', headerName:'Start', width:190, valueFormatter:p=> p.value ? new Date(p.value as string).toLocaleString():'' },
    { field:'end', headerName:'End', width:190, valueFormatter:p=> p.value ? new Date(p.value as string).toLocaleString():'' },
    { field:'notes', headerName:'Notes', flex:1 },
    { field:'actions', headerName:'', width:80, sortable:false, filterable:false, renderCell: params => (
      <IconButton size="small" aria-label="delete" onClick={()=> deleteAvailability(params.row.id)}>
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    )}
  ];

  const heading = useMemo(()=>{
    switch(tab){
      case 'attendance': return 'Attendance';
      case 'shifts': return 'Shifts';
      case 'vacations': return 'Vacations';
      case 'availability': return 'Availability';
      default: return 'Human Resources';
    }
  },[tab]);

  return (
    <Box maxWidth={1400} mx="auto" px={{ xs:1, sm:2, md:3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>{heading}</Typography>
      <Paper elevation={0} variant="outlined" sx={{ p:1.5, borderRadius:2 }}>
        <Tabs value={tab} onChange={changeTab} variant="scrollable" allowScrollButtonsMobile sx={{ '& .MuiTab-root': { textTransform:'none', fontWeight:500, minHeight:44 }, '& .MuiTabs-indicator': { height:3 } }}>
          <Tab label="Attendance" value="attendance" />
          <Tab label="Shifts" value="shifts" />
          <Tab label="Vacations" value="vacations" />
          <Tab label="Availability" value="availability" />
        </Tabs>
        <Divider sx={{ mb:2 }} />
        {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}
        {loading && <Box display="flex" alignItems="center" gap={1} mb={2}><CircularProgress size={20}/><Typography variant="caption" color="text.secondary">Loading…</Typography></Box>}

        <TabPanel active={tab} me="attendance">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">Your attendance</Typography>
            <Stack direction="row" spacing={1}>
              {openAttendance ? (
                <Button size="small" variant="contained" onClick={onClockOut}>Clock out</Button>
              ) : (
                <Button size="small" variant="contained" onClick={onClockIn}>Clock in</Button>
              )}
            </Stack>
          </Stack>
          <div style={{ width:'100%' }}>
            <DataGrid rows={attendance} columns={attendanceCols} autoHeight disableRowSelectionOnClick paginationModel={{ pageSize:10, page:0 }} pageSizeOptions={[10,20,50]} getRowId={(r)=> r.id} />
          </div>
        </TabPanel>

        <TabPanel active={tab} me="shifts">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">Scheduled shifts</Typography>
            <Button size="small" startIcon={<AddIcon/>} variant="contained" onClick={()=> setShiftDlg(true)}>New Shift</Button>
          </Stack>
          <div style={{ width:'100%' }}>
            <DataGrid rows={shifts} columns={shiftCols} autoHeight disableRowSelectionOnClick paginationModel={{ pageSize:10, page:0 }} pageSizeOptions={[10,20,50]} getRowId={(r)=> r.id} />
          </div>
        </TabPanel>

        <TabPanel active={tab} me="vacations">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">Vacation requests</Typography>
            <Button size="small" startIcon={<AddIcon/>} variant="contained" onClick={()=> setVacDlg(true)}>Request Vacation</Button>
          </Stack>
          <div style={{ width:'100%' }}>
            <DataGrid rows={vacations} columns={vacationCols} autoHeight disableRowSelectionOnClick paginationModel={{ pageSize:10, page:0 }} pageSizeOptions={[10,20,50]} getRowId={(r)=> r.id} />
          </div>
        </TabPanel>

        <TabPanel active={tab} me="availability">
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">Extra availability</Typography>
            <Button size="small" startIcon={<AddIcon/>} variant="contained" onClick={()=> setAvailDlg(true)}>Add Availability</Button>
          </Stack>
          <div style={{ width:'100%' }}>
            <DataGrid rows={availability} columns={availabilityCols} autoHeight disableRowSelectionOnClick paginationModel={{ pageSize:10, page:0 }} pageSizeOptions={[10,20,50]} getRowId={(r)=> r.id} />
          </div>
        </TabPanel>
      </Paper>

      {/* Shift Dialog */}
      <Dialog open={shiftDlg} onClose={()=> setShiftDlg(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Shift</DialogTitle>
        <DialogContent sx={{ display:'flex', flexDirection:'column', gap:2, mt:1 }}>
          <TextField label="Start" type="datetime-local" value={shiftForm.start} onChange={e=>setShiftForm(f=>({...f, start:e.target.value}))} fullWidth />
          <TextField label="End" type="datetime-local" value={shiftForm.end} onChange={e=>setShiftForm(f=>({...f, end:e.target.value}))} fullWidth />
          <TextField label="Role" value={shiftForm.role} onChange={e=>setShiftForm(f=>({...f, role:e.target.value}))} fullWidth />
          <TextField label="Location" value={shiftForm.location} onChange={e=>setShiftForm(f=>({...f, location:e.target.value}))} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setShiftDlg(false)}>Cancel</Button>
          <Button variant="contained" disabled={!shiftForm.start || !shiftForm.end} onClick={saveShift}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Vacation Dialog */}
      <Dialog open={vacDlg} onClose={()=> setVacDlg(false)} fullWidth maxWidth="sm">
        <DialogTitle>Request Vacation</DialogTitle>
        <DialogContent sx={{ display:'flex', flexDirection:'column', gap:2, mt:1 }}>
          <TextField label="From" type="date" value={vacForm.startDate} onChange={e=>setVacForm(f=>({...f, startDate:e.target.value}))} fullWidth />
          <TextField label="To" type="date" value={vacForm.endDate} onChange={e=>setVacForm(f=>({...f, endDate:e.target.value}))} fullWidth />
          <TextField label="Reason" value={vacForm.reason} onChange={e=>setVacForm(f=>({...f, reason:e.target.value}))} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setVacDlg(false)}>Cancel</Button>
          <Button variant="contained" disabled={!vacForm.startDate || !vacForm.endDate} onClick={saveVacation}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={availDlg} onClose={()=> setAvailDlg(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Availability</DialogTitle>
        <DialogContent sx={{ display:'flex', flexDirection:'column', gap:2, mt:1 }}>
          <TextField label="Start" type="datetime-local" value={availForm.start} onChange={e=>setAvailForm(f=>({...f, start:e.target.value}))} fullWidth />
          <TextField label="End" type="datetime-local" value={availForm.end} onChange={e=>setAvailForm(f=>({...f, end:e.target.value}))} fullWidth />
          <TextField label="Notes" value={availForm.notes} onChange={e=>setAvailForm(f=>({...f, notes:e.target.value}))} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setAvailDlg(false)}>Cancel</Button>
          <Button variant="contained" disabled={!availForm.start || !availForm.end} onClick={saveAvailability}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
