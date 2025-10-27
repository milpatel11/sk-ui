"use client";
import React from 'react';
import {RolesManager} from '@/features/admin/RolesManager';

export default function ManageRolesPage() {
    // Tenant Admin panel is read-only for roles. Creation is restricted to system administrators.
    return <RolesManager hideTitle readOnly/>;
}