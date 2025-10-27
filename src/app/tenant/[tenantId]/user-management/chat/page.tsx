"use client";
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function LegacyChatRedirect() {
    const router = useRouter();
    useEffect(() => {
        const tid = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
        if (tid) router.replace(`/tenant/${tid}/user-management/chat`); else router.replace('/login');
    }, [router]);
    return null;
}