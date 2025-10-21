"use client";
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminIndexRedirect(){
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;
  useEffect(()=>{
    if (tenantId) router.replace(`/tenant/${tenantId}/admin/manage-groups`);
  },[tenantId, router]);
  return null;
}