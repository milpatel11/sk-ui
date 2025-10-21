"use client";
import React, { useState } from 'react';
import { Box, Typography, Paper, Stack, TextField, Button, Alert } from '@mui/material';
import { usePathname } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

export default function SelfServePage() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean); // tenant / {tenantId} / user-management / self-serve
  const tenantId = parts[1];
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const requestPasswordReset = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      if (!uid) throw new Error('No user id available');
      await apiClient.post('/password-reset-requests', { user_id: uid });
      setMsg({ type: 'success', text: 'Password reset request submitted.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Failed to submit password reset request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={800} mx="auto" py={2}>
      <Typography variant="h5" gutterBottom>Self Serve</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Update password and manage profile addresses (placeholder).</Typography>
      <Stack spacing={3}>
        <Paper sx={{ p:2 }}>
          <Typography variant="subtitle1" gutterBottom>Change Password</Typography>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <TextField type="password" label="Current Password" size="small" fullWidth />
            <TextField type="password" label="New Password" size="small" fullWidth />
            <TextField type="password" label="Confirm New Password" size="small" fullWidth />
          </Stack>
          <Button sx={{ mt:2 }} size="small" variant="contained" disabled>Update (mock)</Button>
        </Paper>

        <Paper sx={{ p:2 }}>
          <Typography variant="subtitle1" gutterBottom>Billing Address</Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Line 1" size="small" fullWidth />
              <TextField label="Line 2" size="small" fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="City" size="small" fullWidth />
              <TextField label="State" size="small" fullWidth />
              <TextField label="Postal Code" size="small" fullWidth />
            </Stack>
            <TextField label="Country" size="small" fullWidth />
            <Button sx={{ mt:1 }} size="small" variant="outlined" disabled>Save (mock)</Button>
          </Stack>
        </Paper>

        <Paper sx={{ p:2 }}>
          <Typography variant="subtitle1" gutterBottom>Shipping Address</Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Line 1" size="small" fullWidth />
              <TextField label="Line 2" size="small" fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="City" size="small" fullWidth />
              <TextField label="State" size="small" fullWidth />
              <TextField label="Postal Code" size="small" fullWidth />
            </Stack>
            <TextField label="Country" size="small" fullWidth />
            <Button sx={{ mt:1 }} size="small" variant="outlined" disabled>Save (mock)</Button>
          </Stack>
        </Paper>

        <Paper sx={{ p:2 }}>
          <Typography variant="subtitle1" gutterBottom>Account Actions</Typography>
          <Stack spacing={2}>
            {msg && <Alert severity={msg.type}>{msg.text}</Alert>}
            <Button variant="contained" onClick={requestPasswordReset} disabled={loading}>Request password reset</Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}