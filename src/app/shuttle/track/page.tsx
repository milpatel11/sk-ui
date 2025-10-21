"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Typography, Paper, Stack, Chip } from '@mui/material';
import { apiClient } from '@/lib/apiClient';
import ShuttleLeaflet from '@/features/itdn/ShuttleLeaflet';

interface Stop { id: string; hotelId: string; name: string; lat: number; lng: number; }
interface Vehicle { id: string; name: string; hotelId: string; lat: number; lng: number; lastUpdated: string; shiftMiles: number; active?: boolean; }
interface Booking { id: string; hotelId: string; guestName: string; guestEmail: string; pickupStopId: string; dropoffStopId: string; scheduledAt: string; status: 'BOOKED'|'EN_ROUTE'|'PICKED_UP'|'DROPPED_OFF'|'RUNNING_LATE'; assignedVehicleId?: string|null; etaMinutes?: number|null; trackingCode: string; createdAt: string; updatedAt: string; notes?: string; passengers?: number; }

export default function ShuttleTrackPage(){
  const q = useSearchParams();
  const code = q?.get('code') || '';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);

  // initial load
  useEffect(()=>{
    let mounted = true;
    const load = async ()=>{
      const res = await apiClient.get(`/itdn/shuttle/track?code=${encodeURIComponent(code)}`);
      if (!mounted) return;
      const data = res.data as { booking: Booking; vehicle: Vehicle|null } | null;
      if (data && data.booking){
        setBooking(data.booking);
        setVehicle(data.vehicle || null);
        try {
          const st = await apiClient.get(`/itdn/shuttle/stops?hotelId=${data.booking.hotelId}`);
          setStops(Array.isArray(st.data) ? st.data : []);
        } catch {}
      }
    };
    if (code) void load();
    return ()=>{ mounted = false; };
  },[code]);

  // poll for updates
  useEffect(()=>{
    if (!booking) return;
    const id = setInterval(async ()=>{
      try {
        const r = await apiClient.get(`/itdn/shuttle/track?code=${encodeURIComponent(code)}`);
        const data = r.data as { booking: Booking; vehicle: Vehicle|null } | null;
        if (data){ setBooking(data.booking); setVehicle(data.vehicle || null); }
      } catch {}
    }, 5000);
    return ()=> clearInterval(id);
  },[booking, code]);

  const points = useMemo(()=>{
    if (!booking) return [] as any[];
    const pickup = stops.find(s => s.id === booking.pickupStopId);
    const drop = stops.find(s => s.id === booking.dropoffStopId);
    const arr: any[] = [];
    if (pickup) arr.push({ id: pickup.id, lat: pickup.lat, lng: pickup.lng, type: 'stop', label: 'Pickup: ' + pickup.name, color: '#2e7d32' });
    if (drop) arr.push({ id: drop.id, lat: drop.lat, lng: drop.lng, type: 'stop', label: 'Drop: ' + drop.name, color: '#9e9e9e' });
    if (vehicle) arr.push({ id: vehicle.id, lat: vehicle.lat, lng: vehicle.lng, type: 'vehicle', label: vehicle.name, color: '#1976d2' });
    return arr;
  },[booking, vehicle, stops]);

  if (!code) return <Box p={2}><Typography>Missing tracking code.</Typography></Box>;
  if (!booking) return <Box p={2}><Typography>Loading booking details…</Typography></Box>;

  return (
    <Box maxWidth={900} mx="auto" p={2}>
      <Typography variant="h5" gutterBottom>Shuttle Tracking</Typography>
      <Paper variant="outlined" sx={{ p:2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} alignItems={{ xs:'flex-start', sm:'center' }}>
          <Typography variant="body2" sx={{ flex:1 }}>
            Guest: <b>{booking.guestName}</b> • {new Date(booking.scheduledAt).toLocaleString()}
          </Typography>
          <Chip label={booking.status.replace('_',' ')} size="small" color={booking.status==='DROPPED_OFF' ? 'success' : booking.status==='RUNNING_LATE' ? 'warning' : 'primary'} />
          {typeof booking.etaMinutes === 'number' && <Chip label={`ETA ${booking.etaMinutes}m`} size="small" />}
        </Stack>
        <Box mt={2}>
          <ShuttleLeaflet points={points as any} height={320} />
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>This page updates automatically.</Typography>
      </Paper>
    </Box>
  );
}