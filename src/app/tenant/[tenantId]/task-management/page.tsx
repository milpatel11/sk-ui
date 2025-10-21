"use client";
import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const VALID_TABS = ['dashboard','board','workflows','sla','instances'];
const STORAGE_KEY_PREFIX = 'tms:lastTab:';

export default function TaskManagementRootRedirect(){
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;

  useEffect(()=>{
    if (!tenantId) return;
    const storageKey = STORAGE_KEY_PREFIX + tenantId;
    let stored: string | null = null;
    if (typeof window !== 'undefined') stored = localStorage.getItem(storageKey);
    const fallback = 'dashboard';
    const tab = stored && VALID_TABS.includes(stored) ? stored : fallback;
    router.replace(`/tenant/${tenantId}/task-management/${tab}`);
  }, [router, tenantId]);
  return null;
}