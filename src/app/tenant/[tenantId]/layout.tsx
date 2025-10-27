"use client";
import React from 'react';
import {ProtectedLayout} from '@/features/layout/ProtectedLayout';

export default function TenantScopedLayout({children}: { children: React.ReactNode }) {
    return <ProtectedLayout>{children}</ProtectedLayout>;
}
