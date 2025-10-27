"use client";
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useParams} from 'next/navigation';
import {Box, Chip, IconButton, Paper, Stack, TextField, Tooltip, Typography, MenuItem, Button} from '@mui/material';
import {DataGrid, GridColDef} from '@mui/x-data-grid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {apiClient} from '@/lib/apiClient';

interface Stop {
  id: string;
  hotelId: string;
  name: string;
  lat: number;
  lng: number;
}

interface Booking {
  id: string;
  hotelId: string;
  guestName: string;
  guestEmail: string;
  pickupStopId: string;
  dropoffStopId: string;
  scheduledAt: string;
  status: 'BOOKED' | 'EN_ROUTE' | 'PICKED_UP' | 'DROPPED_OFF' | 'RUNNING_LATE';
  assignedVehicleId?: string | null;
  etaMinutes?: number | null;
  trackingCode: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  passengers?: number;
}

export default function ShuttleBookingsPage() {
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;

  const [stops, setStops] = useState<Stop[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // lightweight filters
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<Booking['status'] | 'ALL'>('ALL');

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setError(null);
      const [stR, bR] = await Promise.all([
        apiClient.get(`/itdn/shuttle/stops?hotelId=${tenantId}`),
        apiClient.get(`/itdn/shuttle/bookings?hotelId=${tenantId}`)
      ]);
      setStops(Array.isArray(stR.data) ? stR.data : []);
      setBookings(Array.isArray(bR.data) ? bR.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  // poll every 5s
  useEffect(() => {
    if (!tenantId) return;
    const id = setInterval(async () => {
      try {
        const r = await apiClient.get(`/itdn/shuttle/bookings?hotelId=${tenantId}`);
        setBookings(Array.isArray(r.data) ? r.data : []);
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, [tenantId]);

  const updateStatus = async (id: string, status: Booking['status']) => {
    try {
      await apiClient.patch(`/itdn/shuttle/bookings/${id}`, { status });
      setBookings(prev => prev.map(b => (b.id === id ? { ...b, status } : b)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const copyLink = (b: Booking) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/shuttle/track?code=${encodeURIComponent(b.trackingCode)}`;
    navigator.clipboard?.writeText(url).catch(() => {});
  };

  const stopsById = useMemo(() => new Map(stops.map(s => [s.id, s.name])), [stops]);
  const filtered = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (!q) return true;
      const pickup = stopsById.get(b.pickupStopId) || '';
      const drop = stopsById.get(b.dropoffStopId) || '';
      const hay = `${b.guestName} ${b.guestEmail} ${pickup} ${drop}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [bookings, q, statusFilter, stopsById]);

  const columns: GridColDef[] = [
    { field: 'guestName', headerName: 'Guest', flex: 1, minWidth: 160 },
    { field: 'guestEmail', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'scheduledAt', headerName: 'Scheduled', width: 180,
      valueGetter: (params: any) => new Date((params.row as any).scheduledAt).toLocaleString(),
      sortComparator: (a, b) => new Date(a as any).getTime() - new Date(b as any).getTime(),
    },
    {
      field: 'route', headerName: 'Route', flex: 1.5, minWidth: 220,
      valueGetter: (params: any) => {
        const b = params.row as Booking;
        const pickup = stopsById.get(b.pickupStopId) || b.pickupStopId;
        const drop = stopsById.get(b.dropoffStopId) || b.dropoffStopId;
        return `${pickup} → ${drop}`;
      }
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (p: any) => {
        const val = (p.row as Booking).status;
        const color = val === 'DROPPED_OFF' ? 'success' : val === 'RUNNING_LATE' ? 'warning' : 'primary';
        return <Chip label={val.replace('_', ' ')} color={color as any} size="small" />;
      }
    },
    {
      field: 'eta', headerName: 'ETA', width: 90,
      valueGetter: (params: any) => {
        const m = (params.row as Booking).etaMinutes;
        return typeof m === 'number' ? `${m}m` : '';
      }
    },
    {
      field: 'actions', headerName: 'Actions', width: 380, sortable: false, filterable: false,
      renderCell: (p: any) => {
        const b = p.row as Booking;
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button size="small" onClick={() => updateStatus(b.id, 'EN_ROUTE')}>En Route</Button>
            <Button size="small" onClick={() => updateStatus(b.id, 'PICKED_UP')}>Picked Up</Button>
            <Button size="small" onClick={() => updateStatus(b.id, 'DROPPED_OFF')}>Dropped Off</Button>
            <Button size="small" color="warning" onClick={() => updateStatus(b.id, 'RUNNING_LATE')}>Running Late</Button>
            <Tooltip title="Copy guest tracking link"><IconButton size="small" onClick={() => copyLink(b)}><ContentCopyIcon fontSize="inherit"/></IconButton></Tooltip>
          </Stack>
        );
      }
    }
  ];

  const activeCount = bookings.filter(b => b.status !== 'DROPPED_OFF').length;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} mb={2}>
        <TextField label="Search" size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 220 }} />
        <TextField select label="Status" size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} sx={{ width: 180 }}>
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="BOOKED">Booked</MenuItem>
          <MenuItem value="EN_ROUTE">En Route</MenuItem>
          <MenuItem value="PICKED_UP">Picked Up</MenuItem>
          <MenuItem value="DROPPED_OFF">Dropped Off</MenuItem>
          <MenuItem value="RUNNING_LATE">Running Late</MenuItem>
        </TextField>
        <Box flexGrow={1} />
        <Chip label={`Active: ${activeCount}`} size="small" />
      </Stack>

      <Paper sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          density="compact"
        />
      </Paper>

      {error && <Typography color="error" mt={2}>{error}</Typography>}
    </Box>
  );
}