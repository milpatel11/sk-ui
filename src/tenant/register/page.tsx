import React from 'react';
import TenantRegistrationForm from '@/features/tenants/TenantRegistrationForm';
import TenantOnboardingPanel from '@/features/tenants/TenantOnboardingPanel';
import {ProtectedLayout} from '@/features/layout/ProtectedLayout';
import {Box} from '@mui/material';

export default function TenantRegisterPage() {
    return (
        <ProtectedLayout title="Register / Join Tenant">
            <Box maxWidth={1000} mx="auto">
                <TenantOnboardingPanel/>
                <Box display="flex" justifyContent="center" alignItems="flex-start" mt={2}>
                    <TenantRegistrationForm/>
                </Box>
            </Box>
        </ProtectedLayout>
    );
}