"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, Typography, Paper, Stack, Button, Chip, CircularProgress, Alert } from '@mui/material';
import { apiClient } from '@/lib/apiClient';
import type { Task } from '@/lib/types';

const statusColor = (s?: string) => {
  if (!s) return 'default';
  const st = s.toLowerCase();
  if (st.includes('done')) return 'success';
  if (st.includes('in_progress') || st.includes('in-progress') || st.includes('in progress')) return 'warning';
  if (st.includes('open')) return 'info';
  if (st.includes('blocked') || st.includes('breach')) return 'error';
  return 'default';
};

export default function TasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);
  const tenantId = parts[1];

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await apiClient.get('/tms/tasks');
        if (!mounted) return;
        const list = Array.isArray(resp.data) ? resp.data as Task[] : [];
        setTasks(list);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load tasks');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const openInTms = (taskId?: string) => {
    if (!tenantId) return;
    // Navigate to Task Management board; include taskId as query param so TMS can focus if supported
    const url = taskId ? `/tenant/${tenantId}/task-management/board?taskId=${encodeURIComponent(taskId)}` : `/tenant/${tenantId}/task-management/board`;
    router.push(url);
  };

  return (
    <Box maxWidth={900} mx="auto" py={2}>
      <Typography variant="h5" gutterBottom>My Tasks</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Tasks aggregated from the Task Management service.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" alignItems="center" gap={1}><CircularProgress size={18} /><Typography variant="caption" color="text.secondary">Loading tasks…</Typography></Box>
      ) : (
        <Stack spacing={2}>
          {tasks.map(t => (
            <Paper key={t.id} sx={{ p:2, display:'flex', alignItems:'center', gap:2 }}>
              <Chip label={t.status || 'UNKNOWN'} size="small" color={statusColor(t.status) as any} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>{t.title || t.id}</Typography>
                {t.priority && <Typography variant="caption" color="text.secondary">Priority: {t.priority}</Typography>}
              </Box>
              <Button size="small" variant="outlined" onClick={() => openInTms(t.id)}>Open</Button>
            </Paper>
          ))}
          {tasks.length === 0 && <Typography variant="caption" color="text.secondary">No tasks assigned.</Typography>}
        </Stack>
      )}
    </Box>
  );
}