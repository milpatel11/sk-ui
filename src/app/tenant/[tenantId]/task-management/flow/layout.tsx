"use client";
import React, {useMemo} from 'react';
import {Box, Paper, Tab, Tabs, Typography} from '@mui/material';
import {useParams, usePathname, useRouter} from 'next/navigation';

const SLUGS = ['designer', 'sequence'] as const;

type FlowTab = typeof SLUGS[number];

export default function FlowLayout({children}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;
  const parts = pathname.split('/').filter(Boolean); // ['tenant', id, 'task-management', 'flow', sub]
  const routeTab = parts[4] as FlowTab | undefined;
  const value: FlowTab = (routeTab && (SLUGS as readonly string[]).includes(routeTab)) ? routeTab : 'designer';

  const handleChange = (_: React.SyntheticEvent, v: string) => {
    if (!tenantId || v === value) return;
    router.replace(`/tenant/${tenantId}/task-management/flow/${v}`);
  };

  const heading = useMemo(() => 'Flow', []);

  return (
    <Box maxWidth={1400} mx="auto" px={{xs: 1, sm: 2, md: 3}} py={2}>
      <Typography variant="h5" gutterBottom fontWeight={700}>{heading}</Typography>
      <Paper variant="outlined" sx={{p: 1, mb: 2}}>
        <Tabs value={value} onChange={handleChange} variant="scrollable" allowScrollButtonsMobile
              sx={{'& .MuiTab-root': {textTransform: 'none', fontWeight: 600}}}>
          <Tab label="Flow Designer" value="designer"/>
          <Tab label="Sequence Diagram" value="sequence"/>
        </Tabs>
      </Paper>
      {children}
    </Box>
  );
}