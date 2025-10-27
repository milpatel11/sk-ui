"use client";
import React, {useMemo} from 'react';
import {Box, Paper, Tab, Tabs, Typography} from '@mui/material';
import {useParams, usePathname, useRouter} from 'next/navigation';

const SLUGS = ['shuttle', 'courier', 'bookings'] as const;

type ItdnTab = typeof SLUGS[number];

export default function ITDNLayout({children}: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const tenantId = params?.tenantId as string | undefined;
    const parts = pathname.split('/').filter(Boolean); // ['tenant', tenantId, 'itdn', maybeSlug]
    const routeTab = (parts[3] as ItdnTab) || 'shuttle';
    const value: ItdnTab = (SLUGS as readonly string[]).includes(routeTab) ? routeTab : 'shuttle';

    const handleChange = (_: React.SyntheticEvent, v: string) => {
        if (!tenantId || v === value) return;
        router.replace(`/tenant/${tenantId}/itdn/${v}`);
    };

    const heading = useMemo(() => {
        switch (value) {
            case 'shuttle':
                return 'Shuttle Service';
            case 'courier':
                return 'Courier';
            case 'bookings':
                return 'Shuttle Bookings';
            default:
                return 'ITDN';
        }
    }, [value]);

    return (
        <Box maxWidth={1400} mx="auto" px={{xs: 1, sm: 2, md: 3}} py={2}>
            <Typography variant="h5" gutterBottom fontWeight={700}>{heading}</Typography>
            <Paper variant="outlined" sx={{p: 1, mb: 2}}>
                <Tabs value={value} onChange={handleChange} variant="scrollable" allowScrollButtonsMobile
                      sx={{'& .MuiTab-root': {textTransform: 'none', fontWeight: 600}}}>
                    <Tab label="Shuttle" value="shuttle"/>
                    <Tab label="Courier" value="courier"/>
                    <Tab label="Bookings" value="bookings"/>
                </Tabs>
            </Paper>
            {children}
        </Box>
    );
}