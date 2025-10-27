"use client";
import React from 'react';
import { Box, Paper, Stack, Typography, Divider, Button, Alert } from '@mui/material';
import { TenantSelector } from '@/features/tenants/TenantSelector';
import TenantRegistrationForm from '@/features/tenants/TenantRegistrationForm';
import { useRouter } from 'next/navigation';
import { useTenants } from '@/features/tenants/TenantContext';

export default function LobbyPage() {
  const router = useRouter();
  const { activeTenantId } = useTenants();

  const enterTenant = () => {
    if (activeTenantId) router.push(`/tenant/${activeTenantId}`);
  };

  return (
    <Box maxWidth={1200} mx="auto" px={{ xs: 1, sm: 2, md: 3 }} py={{ xs: 2, sm: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: 24, sm: 28 } }}>Lobby</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Pick or create a tenant. This is the entry point for everyone in your organization.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Enter an existing tenant</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Box sx={{ minWidth: { xs: '100%', sm: 320 } }}>
              <TenantSelector fullWidth />
            </Box>
            <Box flexGrow={1} />
            <Button variant="contained" onClick={enterTenant} disabled={!activeTenantId} sx={{ textTransform: 'none' }}>Enter</Button>
          </Stack>
        </Paper>

        <Divider />

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="flex-start">
          <Box flex={1} minWidth={320}>
            <TenantRegistrationForm />
          </Box>

          <Box flex={1} minWidth={280}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Join an existing tenant</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                If you received an invitation link or code from an admin, use that to join directly. Self‑service join requests will be available soon.
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Tip: Ask your admin to send you an invite link from the Admin → Manage Users page.
              </Alert>
            </Paper>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
