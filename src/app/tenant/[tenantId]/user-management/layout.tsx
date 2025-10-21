"use client";
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';

export default function UserManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // /tenant/{tenantId}/user-management/{maybeTab}
  const router = useRouter();
  const parts = pathname.split('/').filter(Boolean);
  const tenantId = parts[1];
  const routeTab = parts[3] || '';
  // Make Notifications the first/primary entry and default tab
  const VALID = ['notifications','self-serve','chat','tasks','calendar'] as const;
  const initial = (routeTab && (VALID as readonly string[]).includes(routeTab)) ? routeTab : 'notifications';
  const [tab, setTab] = useState<string>(initial);

  // Keep tab in sync with route
  React.useEffect(()=>{
    const rt = parts[3];
    if (rt && (VALID as readonly string[]).includes(rt)) setTab(rt);
    if (!rt) setTab('notifications');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[pathname]);

  const handleChange = (_: React.SyntheticEvent, value: string) => {
    if (value === tab) return;
    setTab(value);
    if (tenantId) {
      router.replace(`/tenant/${tenantId}/user-management/${value}`);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>User Portal</Typography>
      <Paper variant="outlined" sx={{ p:1, mb:2 }}>
        <Tabs value={tab} onChange={handleChange} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="Notifications" value="notifications" />
          <Tab label="Self‑serve" value="self-serve" />
          <Tab label="Chat" value="chat" />
          <Tab label="Tasks" value="tasks" />
          <Tab label="Calendar" value="calendar" />
        </Tabs>
      </Paper>
      <Box>
        {children}
      </Box>
    </Box>
  );
}