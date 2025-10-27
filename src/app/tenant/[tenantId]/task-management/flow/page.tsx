"use client";
import {useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Box, CircularProgress} from '@mui/material';

export default function FlowIndexRedirect() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;
  useEffect(() => {
    if (tenantId) router.replace(`/tenant/${tenantId}/task-management/flow/designer`);
  }, [tenantId, router]);
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight={240}>
      <CircularProgress size={24} />
    </Box>
  );
}