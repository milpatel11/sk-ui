"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';

// Redirect /tenant/{tenantId}/human-resources -> /tenant/{tenantId}/human-resources/attendance
export default function HumanResourcesIndexRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean); // ['tenant','{tenantId}','human-resources']
    const tenantId = parts[1];
    if (tenantId) router.replace(`/tenant/${tenantId}/human-resources/attendance`);
  }, [pathname, router]);
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight={200}>
      <CircularProgress size={24} />
    </Box>
  );
}