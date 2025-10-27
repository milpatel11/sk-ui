"use client";
import React, {useState} from 'react';
import {Alert, Box, Button, Paper, Stack, Typography} from '@mui/material';
import {usePathname, useRouter} from 'next/navigation';
import {apiClient} from '@/lib/apiClient';

export default function SelfServePage() {
    const pathname = usePathname();
    const parts = pathname.split('/').filter(Boolean); // tenant / {tenantId} / self-serve / {userId}
    const tenantId = parts[1];
    const userId = parts[3];
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const requestPasswordReset = async () => {
        setMsg(null);
        setLoading(true);
        try {
            const resp = await apiClient.post('/password-reset-requests', {user_id: userId});
            setMsg({type: 'success', text: 'Password reset request submitted.'});
        } catch (err: any) {
            setMsg({type: 'error', text: err?.message || 'Failed to submit password reset request'});
        } finally {
            setLoading(false);
        }
    };

    const openCalendar = () => {
        if (tenantId) router.push(`/tenant/${tenantId}/user-management/calendar`);
    };

    return (
        <Box maxWidth={800} mx="auto">
            <Typography variant="h5" gutterBottom>Self Service</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Manage profile, credentials &
                preferences.</Typography>
            <Paper variant="outlined" sx={{p: 3}}>
                <Typography variant="subtitle1" gutterBottom>User ID: {userId}</Typography>
                <Typography variant="body2" color="text.secondary">Tenant: {tenantId}</Typography>
                <Typography variant="body2" mt={2}>Form sections (profile update, password reset, addresses, etc.) go
                    here.</Typography>

                <Stack spacing={2} mt={3}>
                    {msg && <Alert severity={msg.type}>{msg.text}</Alert>}
                    <Button variant="contained" onClick={requestPasswordReset} disabled={loading}>
                        Request password reset
                    </Button>
                    <Button variant="outlined" onClick={openCalendar}>Open Calendar</Button>
                </Stack>
            </Paper>
        </Box>
    );
}