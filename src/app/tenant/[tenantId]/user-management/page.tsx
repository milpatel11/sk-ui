"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyUserManagementLandingRedirect(){
  const router = useRouter();
  useEffect(() => {
    const parts = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean) : [];
    // If already on a tenant-scoped route, do nothing (preserve any deeper segments like /notifications)
    if (parts[0] === 'tenant') return;
    const tid = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    if (tid) router.replace(`/tenant/${tid}/user-management`); else router.replace('/login');
  }, [router]);
  return null;
}