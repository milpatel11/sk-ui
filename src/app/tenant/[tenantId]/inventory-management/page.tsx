"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';

// Redirect /tenant/{tenantId}/inventory-management -> /tenant/{tenantId}/inventory-management/dashboard
export default function InventoryManagementIndexRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean); // ['tenant','{tenantId}','inventory-management']
    const tenantId = parts[1];
    if (tenantId) router.replace(`/tenant/${tenantId}/inventory-management/dashboard`);
  }, [pathname, router]);
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight={200}>
      <CircularProgress size={24} />
    </Box>
  );
}
