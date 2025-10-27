"use client";
import React, {useMemo} from 'react';
import {Box, Paper, Tab, Tabs, Typography} from '@mui/material';
import {useParams, usePathname, useRouter} from 'next/navigation';

const TOP_SLUGS = ['tasks', 'approvals', 'workflows', 'sla', 'boards', 'flow'] as const;

export default function TaskManagementLayout({children}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;
  const parts = pathname.split('/').filter(Boolean); // ['tenant', tenantId, 'task-management', maybeSlug, ...]
  const sub = parts[3] as typeof TOP_SLUGS[number] | undefined;
  const value = (TOP_SLUGS as readonly string[]).includes(sub || '') ? (sub as typeof TOP_SLUGS[number]) : 'tasks';

  const handleChange = (_: React.SyntheticEvent, v: string) => {
    if (!tenantId || v === value) return;
    if (v === 'sla') {
      router.replace(`/tenant/${tenantId}/task-management/sla/policies`);
    } else {
      router.replace(`/tenant/${tenantId}/task-management/${v}`);
    }
  };

  const heading = useMemo(() => 'Task Management', []);

  return (
    <Box maxWidth={1400} mx="auto" px={{xs: 1, sm: 2, md: 3}} py={2}>
      <Typography variant="h5" gutterBottom fontWeight={700}>{heading}</Typography>
      <Paper variant="outlined" sx={{p: 1, mb: 2}}>
        <Tabs value={value} onChange={handleChange} variant="scrollable" allowScrollButtonsMobile
              sx={{'& .MuiTab-root': {textTransform: 'none', fontWeight: 600}}}>
          <Tab label="Tasks" value="tasks"/>
          <Tab label="Approvals" value="approvals"/>
          <Tab label="Workflows" value="workflows"/>
          <Tab label="SLA" value="sla"/>
          <Tab label="Boards" value="boards"/>
          <Tab label="Flow" value="flow"/>
        </Tabs>
      </Paper>
      {children}
    </Box>
  );
}