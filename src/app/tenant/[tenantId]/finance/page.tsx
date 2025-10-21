"use client";
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Redirect /tenant/{tenantId}/finance -> /tenant/{tenantId}/finance/pos (default tab)
export default function FinanceIndexRedirect(){
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;
  useEffect(()=>{
    if (tenantId) router.replace(`/tenant/${tenantId}/finance/pos`);
  },[tenantId, router]);
  return null;
}