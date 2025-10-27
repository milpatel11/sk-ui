"use client";
import React, {useEffect} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {Box, CircularProgress, Typography} from '@mui/material';

export default function SelfServeIndex() {
    const router = useRouter();
    const pathname = usePathname();
    useEffect(() => {
        const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        const parts = pathname.split('/').filter(Boolean); // tenant / {tenantId} / self-serve
        const tenantId = parts[1];
        if (uid && tenantId) {
            router.replace(`/tenant/${tenantId}/self-serve/${uid}`);
        }
    }, [router, pathname]);
    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" mt={8} gap={2}>
            <CircularProgress size={28}/>
            <Typography variant="body2" color="text.secondary">Loading self‑serve...</Typography>
        </Box>
    );
}
