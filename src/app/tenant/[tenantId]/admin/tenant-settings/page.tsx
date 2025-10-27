"use client";
import React, { useMemo, useState } from 'react';
import { Box, Paper, Tab, Tabs } from '@mui/material';
import ManageTenantPanel from '@/features/tenants/ManageTenantPanel';
import TenantConfigurationsPanel from '@/features/tenants/TenantConfigurationsPanel';

const TABS = ['general', 'config'] as const;

type SettingsTab = typeof TABS[number];

export default function TenantSettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('general');

  return (
    <Box>
      <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ '& .MuiTab-root': { textTransform: 'none', minHeight: 44, fontWeight: 600 } }}
        >
          <Tab label="General Tenant Information" value="general" />
          <Tab label="Configurations" value="config" />
        </Tabs>
      </Paper>
      {tab === 'general' && (
        <ManageTenantPanel />
      )}
      {tab === 'config' && (
        <TenantConfigurationsPanel />
      )}
    </Box>
  );
}
