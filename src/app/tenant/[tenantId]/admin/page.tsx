"use client";
import {useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Box, CircularProgress} from '@mui/material';

export default function AdminIndexRedirect() {
    const router = useRouter();
    const params = useParams();
    const tenantId = params?.tenantId as string | undefined;
    useEffect(() => {
        if (tenantId) router.replace(`/tenant/${tenantId}/admin/manage-groups`);
    }, [tenantId, router]);
    return (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={200}>
            <CircularProgress size={24} />
        </Box>
    );
}