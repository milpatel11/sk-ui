"use client";
import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useAuth} from '@/features/auth/AuthContext';

// Custom 404 page. Decides best redirect target based on auth state.
export default function NotFound() {
    const {isAuthenticated} = useAuth();
    const router = useRouter();
    const lockedTenant = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    const target = isAuthenticated ? (lockedTenant ? `/tenant/${lockedTenant}` : '/login') : '/login';
    const [seconds, setSeconds] = useState(5);

    useEffect(() => {
        if (seconds <= 0) {
            router.replace(target);
            return;
        }
        const t = setTimeout(() => setSeconds(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [seconds, target, router]);

    return (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" p={2}>
            <Paper elevation={3} sx={{p: 5, maxWidth: 500, width: '100%', textAlign: 'center'}}>
                <Typography variant="h3" gutterBottom>404</Typography>
                <Typography variant="h6" gutterBottom>Page Not Found</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    The page you are looking for doesn’t exist or was moved.
                </Typography>
                <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} justifyContent="center" mb={2}>
                    <Button variant="contained" onClick={() => router.push(target)}>
                        Go to {isAuthenticated ? 'Tenant Home' : 'Login'}
                    </Button>
                    {isAuthenticated && lockedTenant && (
                        <Button variant="outlined"
                                onClick={() => router.push(`/tenant/${lockedTenant}/admin`)}>Admin</Button>
                    )}
                    {!isAuthenticated && (
                        <Button variant="outlined" onClick={() => router.push('/signup')}>Sign Up</Button>
                    )}
                </Stack>
                <Typography variant="caption" display="block" color="text.secondary">
                    Redirecting in {seconds}s...
                </Typography>
            </Paper>
        </Box>
    );
}