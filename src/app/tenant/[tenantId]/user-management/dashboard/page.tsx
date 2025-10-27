"use client";
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function LegacyDashboardRedirect() {
    const router = useRouter();
    useEffect(() => {
        const tid = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
        if (tid) router.replace(`/tenant/${tid}/user-management/dashboard`); else router.replace('/login');
    }, [router]);
    return null;
}