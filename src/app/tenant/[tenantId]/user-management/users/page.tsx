// Redirect apps user list to tenant-scoped user-management users
"use client";
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function LegacyUsersListRedirect() {
    const router = useRouter();
    useEffect(() => {
        const tid = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
        if (tid) router.replace(`/tenant/${tid}/user-management/users`); else router.replace('/login');
    }, [router]);
    return null;
}