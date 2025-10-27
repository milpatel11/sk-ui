import React from 'react';
import TenantRegistrationForm from '@/features/tenants/TenantRegistrationForm';
import TenantOnboardingPanel from '@/features/tenants/TenantOnboardingPanel';
import {ProtectedLayout} from '@/features/layout/ProtectedLayout';
import {Box, Typography} from '@mui/material';

export default function TenantRegisterPage() {
    return (
        <ProtectedLayout title="Tenant Onboarding">
            <Box maxWidth={1320} mx="auto" px={{xs: 1, sm: 2, md: 3}}>
                <Typography variant="h4" fontWeight={600} mb={0.5} sx={{fontSize: {xs: 26, md: 32}}}>Get
                    Started</Typography>
                <Typography variant="body1" color="text.secondary" mb={4} maxWidth={760}>
                    Accept an invitation, request access to an existing tenant, or create a brand new tenant for your
                    organization.
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: { xs: 3, md: 4 },
                    alignItems: 'flex-start',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '5fr 7fr',
                      lg: '4fr 8fr'
                    }
                  }}
                >
                  <Box sx={{display: 'flex', flexDirection: 'column', gap: 32 / 8}}>
                    <TenantOnboardingPanel/>
                  </Box>
                  <Box>
                    <TenantRegistrationForm/>
                  </Box>
                </Box>
            </Box>
        </ProtectedLayout>
    );
}