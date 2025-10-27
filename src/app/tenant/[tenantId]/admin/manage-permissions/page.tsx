"use client";
import React from 'react';
import {PermissionsManager} from '@/features/admin/PermissionsManager';

export default function ManagePermissionsPage() {
    // Tenant Admin panel is read-only for permissions. Creation is restricted to system administrators.
    return <PermissionsManager hideTitle readOnly/>;
}