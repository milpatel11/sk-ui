"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Paper, Stack, TextField, Button, MenuItem, Divider, Chip, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { apiClient } from '@/lib/apiClient';
import ShuttleLeaflet from '@/features/itdn/ShuttleLeaflet';

interface Stop { id: string; hotelId: string; name: string; lat: number; lng: number; }
interface Vehicle { id: string; name: string; hotelId: string; lat: number; lng: number; lastUpdated: string; shiftMiles: number; active?: boolean; }
interface Booking { id: string; hotelId: string; guestName: string; guestEmail: string; pickupStopId: string; dropoffStopId: string; scheduledAt: string; status: 'BOOKED'|'EN_ROUTE'|'PICKED_UP'|'DROPPED_OFF'|'RUNNING_LATE'; assignedVehicleId?: string|null; etaMinutes?: number|null; trackingCode: string; createdAt: string; updatedAt: string; notes?: string; passengers?: number; }

export default function ShuttleOpsPage(){
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;

  const [stops, setStops] = useState<Stop[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  // Form state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [pickupStopId, setPickupStopId] = useState('');
  const [dropoffStopId, setDropoffStopId] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [passengers, setPassengers] = useState<number>(1);

  const load = useCallback(async ()=>{
    if (!tenantId) return;
    try {
      setLoading(true); setError(null);
      const [stR, vR, bR] = await Promise.all([
        apiClient.get(`/itdn/shuttle/stops?hotelId=${tenantId}`),
        apiClient.get(`/itdn/shuttle/vehicles?hotelId=${tenantId}`),
        apiClient.get(`/itdn/shuttle/bookings?hotelId=${tenantId}`)
      ]);
      setStops(Array.isArray(stR.data) ? stR.data : []);
      setVehicles(Array.isArray(vR.data) ? vR.data : []);
      setBookings(Array.isArray(bR.data) ? bR.data : []);
    } catch(e){ setError(e instanceof Error ? e.message : 'Failed to load shuttle data'); }
    finally { setLoading(false); }
  },[tenantId]);

  useEffect(()=>{ void load(); },[load]);

  // Poll vehicles and bookings every 5s for live view
  useEffect(()=>{
    if (!tenantId) return;
    const id = setInterval(async ()=>{
      try {
        const [vR, bR] = await Promise.all([
          apiClient.get(`/itdn/shuttle/vehicles?hotelId=${tenantId}`),
          apiClient.get(`/itdn/shuttle/bookings?hotelId=${tenantId}`)
        ]);
        setVehicles(Array.isArray(vR.data) ? vR.data : []);
        setBookings(Array.isArray(bR.data) ? bR.data : []);
      } catch {}
    }, 5000);
    return ()=> clearInterval(id);
  },[tenantId]);

  const handleCreate = async () => {
    if (!tenantId || !guestName || !guestEmail || !pickupStopId || !dropoffStopId) return;
    try {
      setLoading(true);
      const res = await apiClient.post('/itdn/shuttle/bookings', { hotelId: tenantId, guestName, guestEmail, pickupStopId, dropoffStopId, scheduledAt: scheduledAt || undefined, notes, passengers });
      setGuestName(''); setGuestEmail(''); setPickupStopId(''); setDropoffStopId(''); setScheduledAt(''); setNotes(''); setPassengers(1);
      setBookings(prev => [res.data as Booking, ...prev]);
    } catch(e){ setError(e instanceof Error ? e.message : 'Booking failed'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, status: Booking['status']) => {
    try {
      await apiClient.patch(`/itdn/shuttle/bookings/${id}`, { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    } catch(e){ setError(e instanceof Error ? e.message : 'Update failed'); }
  };

  const points = useMemo(() => {
    const stopPts = stops.map(s => ({ id: s.id, lat: s.lat, lng: s.lng, type: 'stop' as const, label: s.name }));
    const vehPts = vehicles.map(v => ({ id: v.id, lat: v.lat, lng: v.lng, type: 'vehicle' as const, label: v.name, color: '#1976d2' }));
    return [...stopPts, ...vehPts];
  }, [stops, vehicles]);

  const totalMiles = vehicles.reduce((a, v) => a + (v.shiftMiles || 0), 0);
  const activeBookings = bookings.filter(b => b.status !== 'DROPPED_OFF').length;

  const copyLink = (b: Booking) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/shuttle/track?code=${encodeURIComponent(b.trackingCode)}`;
    navigator.clipboard?.writeText(url).catch(()=>{});
  };

  const nudgeVehicle = async (v: Vehicle) => {
    // simulate small movement toward first stop
    const target = stops[0]; if (!target) return;
    const lat = v.lat + (target.lat - v.lat) * 0.1;
    const lng = v.lng + (target.lng - v.lng) * 0.1;
    await apiClient.post(`/itdn/shuttle/vehicles/${v.id}/position`, { lat, lng });
    void load();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Hotel Shuttle Operations</Typography>
      <Stack direction={{ xs:'column', md:'row' }} spacing={2} alignItems={{ xs:'stretch', md:'flex-start' }}>
        <Paper variant="outlined" sx={{ p:2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>New Booking (Front Desk)</Typography>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems="flex-end">
            <TextField label="Guest Name" value={guestName} onChange={e=>setGuestName(e.target.value)} size="small" fullWidth />
            <TextField label="Guest Email" type="email" value={guestEmail} onChange={e=>setGuestEmail(e.target.value)} size="small" fullWidth />
          </Stack>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems="flex-end" mt={2}>
            <TextField select label="Pickup Stop" value={pickupStopId} onChange={e=>setPickupStopId(e.target.value)} size="small" fullWidth>
              {stops.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
            <TextField select label="Dropoff Stop" value={dropoffStopId} onChange={e=>setDropoffStopId(e.target.value)} size="small" fullWidth>
              {stops.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems="flex-end" mt={2}>
            <TextField label="Scheduled At" type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} size="small" sx={{ width: 240 }} InputLabelProps={{ shrink: true }} />
            <TextField label="Passengers" type="number" value={passengers} onChange={e=>setPassengers(Number(e.target.value)||1)} size="small" sx={{ width: 140 }} />
            <Box flexGrow={1} />
            <Button variant="contained" onClick={handleCreate} disabled={loading || !guestName || !guestEmail || !pickupStopId || !dropoffStopId}>Book Shuttle</Button>
          </Stack>
          <TextField label="Notes" value={notes} onChange={e=>setNotes(e.target.value)} size="small" fullWidth multiline minRows={2} sx={{ mt:2 }} />
        </Paper>
        <Paper variant="outlined" sx={{ p:2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>Live Map</Typography>
          <ShuttleLeaflet points={points as any} height={280} />
          <Stack direction="row" spacing={1} mt={1} alignItems="center">
            {vehicles.map(v => (
              <Tooltip title={`Nudge ${v.name}`} key={v.id}><IconButton size="small" onClick={()=> nudgeVehicle(v)}><MyLocationIcon fontSize="inherit" /></IconButton></Tooltip>
            ))}
            <Box flexGrow={1} />
            <Chip label={`Active bookings: ${activeBookings}`} size="small" />
            <Chip label={`Miles this shift: ${totalMiles.toFixed(2)}`} size="small" />
          </Stack>
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p:2, mt:2 }}>
        <Typography variant="subtitle1" gutterBottom>Bookings</Typography>
        <Divider sx={{ mb:1 }} />
        <Stack spacing={1}>
          {bookings.map(b => (
            <Stack key={b.id} direction={{ xs:'column', sm:'row' }} alignItems={{ xs:'flex-start', sm:'center' }} spacing={1} sx={{ p:1, border:'1px solid', borderColor:'divider', borderRadius:1 }}>
              <Typography variant="body2" sx={{ minWidth: 200 }}><b>{b.guestName}</b> • {new Date(b.scheduledAt).toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flex:1 }}>Pickup: {stops.find(s=>s.id===b.pickupStopId)?.name} → Drop: {stops.find(s=>s.id===b.dropoffStopId)?.name}</Typography>
              <Chip label={b.status.replace('_',' ')} size="small" color={b.status==='DROPPED_OFF' ? 'success' : b.status==='RUNNING_LATE' ? 'warning' : 'primary'} />
              {typeof b.etaMinutes === 'number' && <Chip label={`ETA ${b.etaMinutes}m`} size="small" />}
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={()=> updateStatus(b.id,'EN_ROUTE')}>En Route</Button>
                <Button size="small" onClick={()=> updateStatus(b.id,'PICKED_UP')}>Picked Up</Button>
                <Button size="small" onClick={()=> updateStatus(b.id,'DROPPED_OFF')}>Dropped Off</Button>
                <Button size="small" color="warning" onClick={()=> updateStatus(b.id,'RUNNING_LATE')}>Running Late</Button>
                <Tooltip title="Copy guest tracking link"><IconButton size="small" onClick={()=> copyLink(b)}><ContentCopyIcon fontSize="inherit" /></IconButton></Tooltip>
              </Stack>
            </Stack>
          ))}
          {bookings.length===0 && <Typography variant="caption" color="text.secondary">No bookings yet.</Typography>}
        </Stack>
      </Paper>

      {error && <Typography color="error" mt={2}>{error}</Typography>}
    </Box>
  );
}