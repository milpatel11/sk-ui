"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Stack, IconButton, Button, Select, MenuItem, Switch, FormControlLabel, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputLabel } from '@mui/material';
import { apiClient } from '@/lib/apiClient';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc); dayjs.extend(timezone);
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/navigation';

interface EventItem { id: string; title: string; start: Date; end: Date; color?: string }

// Simple week grid placeholder (no external lib yet)
function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(date.setDate(diff));
}

const buildHours = (is24: boolean) => is24 ? Array.from({ length:24 }).map((_,i)=> i) : Array.from({ length: 10 }).map((_,i)=> 8+i);

export default function CalendarPage() {
  const [view, setView] = useState<'week'|'day'|'month'>('week');
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftStart, setDraftStart] = useState<Dayjs>(dayjs().minute(0));
  const [draftEnd, setDraftEnd] = useState<Dayjs>(dayjs().minute(0).add(30, 'minute'));
  const [draftColor, setDraftColor] = useState('#1976d2');
  const [error, setError] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const weekStart = startOfWeek(cursor);

  const openCreate = (defaults?: { date?: Date; hour?: number }) => {
    const base = defaults?.date ? dayjs(defaults.date) : dayjs();
    const start = defaults?.hour!=null ? base.hour(defaults.hour).minute(0) : base.minute(0);
    setDraftStart(start);
    setDraftEnd(start.add(30, 'minute'));
    setDraftTitle('');
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    setError(null);
    if (!draftTitle.trim()) { setError('Title required'); return; }
    if (draftEnd.isBefore(draftStart)) { setError('End must be after start'); return; }
    try {
      const body = { title: draftTitle.trim(), start: draftStart.toISOString(), end: draftEnd.toISOString(), color: draftColor };
      const res = await apiClient.post('/calendar/events', body);
      const e = (res as any).data;
      setEvents(prev => [...prev, { id: e.id, title: e.title, start: new Date(e.start), end: new Date(e.end), color: e.color }]);
      setCreateOpen(false);
    } catch (e:any) {
      setError(e.message || 'Failed creating event');
    }
  };

  const drillToDay = (d: Date) => {
    setCursor(d);
    setView('day');
  };
  const [fullDay, setFullDay] = useState(false);

  useEffect(() => {
    let from: Date; let to: Date;
    if (view==='month') {
      from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      to = new Date(cursor.getFullYear(), cursor.getMonth()+1, 0, 23,59,59,999);
    } else if (view==='week') {
      const wk = startOfWeek(cursor);
      from = new Date(wk);
      to = new Date(wk.getTime()+7*86400000 - 1);
    } else { // day
      const dayStart = new Date(cursor);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(cursor);
      dayEnd.setHours(23,59,59,999);
      from = dayStart; to = dayEnd;
    }
    const load = async () => {
      setLoadingEvents(true);
      try {
        const res = await apiClient.get(`/calendar/events?from=${from.toISOString()}&to=${to.toISOString()}`);
        const list = (res as any).data || [];
        setEvents(list.map((e: any) => ({ id: e.id, title: e.title, start: new Date(e.start), end: new Date(e.end), color: e.color })));
      } catch (e:any) {
        console.error(e);
      } finally {
        setLoadingEvents(false);
      }
    };
    load();
  }, [view, cursor]);
  const days = useMemo(() => {
    if (view==='day') return [cursor];
    if (view==='week') return Array.from({ length:7 }).map((_,i)=> new Date(weekStart.getTime()+i*86400000));
    // month view days: build grid from first week containing first day of month to last week containing last day
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const lastOfMonth = new Date(cursor.getFullYear(), cursor.getMonth()+1, 0);
    // Align to Monday start
    const gridStart = startOfWeek(firstOfMonth);
    const gridEnd = (() => {
      const d = new Date(lastOfMonth);
      // move to end of its week (Sunday, but our startOfWeek uses Monday) => add days until Sunday
      const day = d.getDay();
      const add = day===0?0:7-day; // days to Sunday
      d.setDate(d.getDate()+add);
      return d;
    })();
    const out: Date[] = [];
    for (let d = new Date(gridStart); d <= gridEnd; d = new Date(d.getTime()+86400000)) out.push(new Date(d));
    return out;
  }, [cursor, view, weekStart]);

  const monthWeeks = useMemo(()=> view==='month'? Math.ceil(days.length / 7): 0, [days.length, view]);
  const hours = useMemo(()=> buildHours(fullDay), [fullDay]);

  const next = () => {
    if (view==='month') setCursor(new Date(cursor.getFullYear(), cursor.getMonth()+1, 1));
    else setCursor(new Date(cursor.getTime() + (view==='week'?7:1)*86400000));
  };
  const prev = () => {
    if (view==='month') setCursor(new Date(cursor.getFullYear(), cursor.getMonth()-1, 1));
    else setCursor(new Date(cursor.getTime() - (view==='week'?7:1)*86400000));
  };

  const formatDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month:'short', day:'numeric' });

  const renderMonth = () => {
    const todayKey = new Date().toDateString();
    return (
      <Box sx={{ overflowX:'auto' }}>
        <Box display="grid" sx={{ gridTemplateColumns:'repeat(7, 1fr)', border:'1px solid', borderColor:'divider', minHeight: 420 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(h => (
            <Box key={h} sx={{ p:0.75, borderRight:'1px solid', borderColor:'divider', bgcolor:'grey.50' }}>
              <Typography variant="caption" fontWeight={600}>{h}</Typography>
            </Box>
          ))}
          {days.map((d,i) => {
            const isToday = d.toDateString()===todayKey;
            const inMonth = d.getMonth()===cursor.getMonth();
            const dayEvents = events.filter(ev => ev.start.getFullYear()===d.getFullYear() && ev.start.getMonth()===d.getMonth() && ev.start.getDate()===d.getDate());
            return (
              <Box key={d.toISOString()} onClick={()=>drillToDay(d)} sx={{ cursor:'pointer', p:0.5, borderRight:'1px solid', borderTop: i<7? 'none':'1px solid', borderColor:'divider', position:'relative', bgcolor: inMonth? 'background.paper':'grey.100', '&:hover': { bgcolor: inMonth? 'grey.50':'grey.200' } }}>
                <Typography variant="caption" fontWeight={isToday?700:400} color={isToday? 'primary.main':'text.secondary'}>{d.getDate()}</Typography>
                <Stack spacing={0.25} mt={0.25}>
                  {dayEvents.slice(0,3).map(ev => (
                    <Tooltip key={ev.id} title={ev.title + ' ' + ev.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}>
                      <Chip size="small" label={ev.title} onClick={(e)=>{ e.stopPropagation(); setActiveEvent(ev); }} sx={{ maxWidth:'100%', bgcolor: ev.color || 'primary.main', color:'#fff' }} />
                    </Tooltip>
                  ))}
                  {dayEvents.length>3 && <Typography variant="caption">+{dayEvents.length-3} more</Typography>}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const router = useRouter();
  useEffect(()=>{
    const tid = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (tid) router.replace(`/tenant/${tid}/user-management/calendar`); else router.replace('/login');
  },[router]);

  return (
    <Box py={2}>
      <Typography variant="h5" gutterBottom>Calendar / Scheduling</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Week / Day / Month views. Toggle 24h for extended hours. Future: drag/drop, availability, meeting creation, attendee management.</Typography>
      <Paper sx={{ p:2 }} variant="outlined">
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems={{ xs:'flex-start', sm:'center' }} justifyContent="space-between" mb={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={prev}><ChevronLeftIcon /></IconButton>
            <IconButton size="small" onClick={next}><ChevronRightIcon /></IconButton>
            <Typography variant="subtitle1">
              {view==='week' && 'Week of '+weekStart.toLocaleDateString()}
              {view==='day' && cursor.toDateString()}
              {view==='month' && cursor.toLocaleString(undefined, { month:'long', year:'numeric' })}
            </Typography>
            <Button size="small" onClick={()=>{ setCursor(new Date()); }}>Today</Button>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Select size="small" value={view} onChange={e=>setView(e.target.value as any)}>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="month">Month</MenuItem>
            </Select>
            {view!=='month' && (
              <FormControlLabel control={<Switch checked={fullDay} onChange={e=>setFullDay(e.target.checked)} size="small" />} label={<Typography variant="caption">24h</Typography>} />
            )}
          </Stack>
        </Stack>
        {view==='month' ? (
          renderMonth()
        ) : (
          <Box sx={{ overflowX:'auto' }}>
            <Box display="grid" sx={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)`, border:'1px solid', borderColor:'divider', minWidth: days.length < 5 ? 600 : 'auto' }}>
              <Box sx={{ borderRight:'1px solid', borderColor:'divider', bgcolor:'grey.50' }} />
              {days.map(d => (
                <Box key={d.toISOString()} onClick={()=> drillToDay(d)} sx={{ cursor:'pointer', borderRight:'1px solid', borderColor:'divider', p:1, bgcolor:'grey.50', '&:hover': { bgcolor:'grey.100' } }}>
                  <Typography variant="caption" fontWeight={600}>{formatDay(d)}</Typography>
                </Box>
              ))}
              {hours.map(h => (
                <React.Fragment key={h}>
                  <Box sx={{ borderTop:'1px solid', borderColor:'divider', borderRight:'1px solid', p:0.5 }}>
                    <Typography variant="caption">{(''+h).padStart(2,'0')}:00</Typography>
                  </Box>
                  {days.map(d => {
                    const cellEvents = events.filter(ev => ev.start.getHours() === h && ev.start.getDate()===d.getDate() && ev.start.getMonth()===d.getMonth());
                    return (
                      <Box key={d.toISOString()+h} onDoubleClick={()=> openCreate({ date:d, hour:h })} sx={{ position:'relative', borderTop:'1px solid', borderColor:'divider', borderRight:'1px solid', p:0.25, minHeight:40, cursor:'cell' }}>
                        {cellEvents.map(ev => (
                          <Box key={ev.id} onClick={()=> setActiveEvent(ev)} sx={{ position:'absolute', top:2, left:2, right:2, bgcolor: ev.color || 'primary.main', color:'primary.contrastText', px:0.5, py:0.25, borderRadius:0.5, '&:hover': { opacity:0.85 } }}>
                            <Typography variant="caption" noWrap>{ev.title}</Typography>
                          </Box>
                        ))}
                      </Box>
                    );
                  })}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      <Stack direction="row" spacing={1} mt={2}>
        <Button variant="contained" size="small" onClick={()=> openCreate()}>New Event</Button>
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf:'center' }}>{loadingEvents? 'Loading events...' : `${events.length} events in view`}</Typography>
      </Stack>

      <Dialog open={createOpen} onClose={()=> setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Event</DialogTitle>
        <DialogContent sx={{ display:'flex', flexDirection:'column', gap:2, mt:1 }}>
          <TextField label="Title" value={draftTitle} onChange={e=> setDraftTitle(e.target.value)} fullWidth size="small" autoFocus />
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
            <TextField
              label="Start"
              type="datetime-local"
              size="small"
              value={draftStart.format('YYYY-MM-DDTHH:mm')}
              onChange={e=> setDraftStart(dayjs(e.target.value))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End"
              type="datetime-local"
              size="small"
              value={draftEnd.format('YYYY-MM-DDTHH:mm')}
              onChange={e=> setDraftEnd(dayjs(e.target.value))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
            <TextField label="Color" type="color" size="small" value={draftColor} onChange={e=> setDraftColor(e.target.value)} sx={{ width:120 }} InputLabelProps={{ shrink: true }} />
          </Stack>
          {error && <Typography variant="caption" color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setCreateOpen(false)}>Cancel</Button>
          <Button onClick={submitCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!activeEvent} onClose={()=> setActiveEvent(null)} fullWidth maxWidth="xs">
        <DialogTitle>{activeEvent?.title}</DialogTitle>
        <DialogContent>
          {activeEvent && (
            <Stack spacing={1} mt={1}>
              <Typography variant="body2">Start: {activeEvent.start.toLocaleString()}</Typography>
              <Typography variant="body2">End: {activeEvent.end.toLocaleString()}</Typography>
              {activeEvent.color && <Stack direction="row" spacing={1} alignItems="center"><InputLabel shrink>Color</InputLabel><Box sx={{ width:20, height:20, borderRadius:'4px', bgcolor: activeEvent.color }} /></Stack>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> { if(activeEvent) drillToDay(activeEvent.start); }}>Go To Day</Button>
          <Button onClick={()=> setActiveEvent(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}