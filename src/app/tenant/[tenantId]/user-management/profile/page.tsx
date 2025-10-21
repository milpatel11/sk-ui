"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyProfileRedirect(){
  const router = useRouter();
  useEffect(()=>{
    const tid = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (tid && uid) router.replace(`/tenant/${tid}/user-management/profile/${uid}`); else if (tid) router.replace(`/tenant/${tid}/user-management/profile`); else router.replace('/login');
  },[router]);
  return null;
}