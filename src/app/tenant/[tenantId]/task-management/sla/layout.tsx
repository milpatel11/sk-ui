"use client";
import React from 'react';
import {Paper, Tab, Tabs} from '@mui/material';
import {useParams, usePathname, useRouter} from 'next/navigation';

const SLUGS = ['policies', 'timers'] as const;

export default function SlaLayout({children}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;
  const parts = pathname.split('/').filter(Boolean); // ['tenant', tenantId, 'task-management', 'sla', maybeSlug]
  const sub = (parts[4] as typeof SLUGS[number]) || 'policies';
  const value: typeof SLUGS[number] = (SLUGS as readonly string[]).includes(sub) ? sub : 'policies';

  const handleChange = (_: React.SyntheticEvent, v: string) => {
    if (!tenantId || v === value) return;
    router.replace(`/tenant/${tenantId}/task-management/sla/${v}`);
  };

  return (
    <>
      <Paper variant="outlined" sx={{p: 1, mb: 2}}>
        <Tabs value={value} onChange={handleChange} variant="scrollable" allowScrollButtonsMobile
              sx={{'& .MuiTab-root': {textTransform: 'none', fontWeight: 600}}}>
          <Tab label="Policies" value="policies"/>
          <Tab label="Timers" value="timers"/>
        </Tabs>
      </Paper>
      {children}
    </>
  );
}
