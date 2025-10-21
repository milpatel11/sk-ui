"use client";
import React from 'react';
import {Box, Paper, Tab, Tabs, Typography} from '@mui/material';
import {useParams, usePathname, useRouter} from 'next/navigation';

const SLUGS = ['manage-groups', 'manage-roles', 'manage-permissions', 'manage-users', 'manage-security'] as const;

type AdminTab = typeof SLUGS[number];

export default function AdminLayout({children}: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const tenantId = params?.tenantId as string | undefined;
    const parts = pathname.split('/').filter(Boolean); // ['tenant', tenantId, 'admin', slug]
    const routeTab = parts[3] as AdminTab | undefined;
    const value: AdminTab = (routeTab && (SLUGS as readonly string[]).includes(routeTab)) ? routeTab : 'manage-groups';

    const handleChange = (_: React.SyntheticEvent, v: string) => {
        if (!tenantId || v === value) return;
        router.replace(`/tenant/${tenantId}/admin/${v}`);
    };

    const headingMap: Record<AdminTab, string> = {
        'manage-groups': 'Groups Manager',
        'manage-roles': 'Roles Manager',
        'manage-permissions': 'Permissions Manager',
        'manage-users': 'User Manager',
        'manage-security': 'Security Manager',
    };

    const heading = headingMap[value];

    return (
        <Box maxWidth={1200} mx="auto" px={{xs: 1, sm: 2, md: 3}} py={2}>
            <Typography variant="h5" gutterBottom fontWeight={700}>{heading}</Typography>
            <Paper variant="outlined" sx={{p: 1, mb: 2}}>
                <Tabs value={value} onChange={handleChange} variant="scrollable" allowScrollButtonsMobile
                      sx={{'& .MuiTab-root': {textTransform: 'none', fontWeight: 600}}}>
                    <Tab label="Manage Groups" value="manage-groups"/>
                    <Tab label="Manage Roles" value="manage-roles"/>
                    <Tab label="Manage Permissions" value="manage-permissions"/>
                    <Tab label="Manage Users" value="manage-users"/>
                    <Tab label="Manage Security" value="manage-security"/>
                </Tabs>
            </Paper>
            {children}
        </Box>
    );
}
