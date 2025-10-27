"use client";
import React from 'react';
import {Box, Paper, Tab, Tabs, Typography} from '@mui/material';
import {useParams, usePathname, useRouter} from 'next/navigation';
import GroupsIcon from '@mui/icons-material/Groups';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';

const SLUGS = ['manage-groups', 'manage-roles', 'manage-permissions', 'manage-users', 'manage-security', 'tenant-settings'] as const;

type AdminTab = typeof SLUGS[number];

export default function AdminLayout({children}: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const tenantId = params?.tenantId as string | undefined;
    const parts = pathname.split('/').filter(Boolean); // ['tenant', tenantId, 'admin', slug]
    const routeTab = parts[3] as AdminTab | undefined;
    const value: AdminTab = (routeTab && (SLUGS as readonly string[]).includes(routeTab)) ? routeTab : 'manage-groups';

    const handleChange = (_: React.SyntheticEvent, v: string) => {
        if (!tenantId || v === value) return;
        router.replace(`/tenant/${tenantId}/admin/${v}`);
    };

    const headingMap: Record<AdminTab, string> = {
        'manage-groups': 'Groups Manager',
        'manage-roles': 'Roles Manager',
        'manage-permissions': 'Permissions Manager',
        'manage-users': 'User Manager',
        'manage-security': 'Security Manager',
        'tenant-settings': 'Tenant Settings',
    };

    const descriptionMap: Record<AdminTab, string> = {
        'manage-groups': 'Create and organize groups to simplify access assignments across your organization.',
        'manage-roles': 'Define roles and scopes to model responsibilities across global, tenant, and applications.',
        'manage-permissions': 'Manage fine-grained permissions that power your roles and policies.',
        'manage-users': 'Onboard users, edit profiles, and manage identities and credentials.',
        'manage-security': 'Configure memberships, roles, and effective permissions in one place.',
        'tenant-settings': 'General tenant information, configurations, branding, and more.',
    };

    const iconMap: Record<AdminTab, React.ReactNode> = {
        'manage-groups': <GroupsIcon fontSize="small" />,
        'manage-roles': <WorkspacePremiumIcon fontSize="small" />,
        'manage-permissions': <VpnKeyIcon fontSize="small" />,
        'manage-users': <PeopleIcon fontSize="small" />,
        'manage-security': <SecurityIcon fontSize="small" />,
        'tenant-settings': <SettingsIcon fontSize="small" />,
    };

    const heading = headingMap[value];
    const subheading = descriptionMap[value];

    return (
        <Box maxWidth={1200} mx="auto" px={{xs: 1, sm: 2, md: 3}} py={2}>
            {/* Header / Hero */}
            <Paper
                elevation={0}
                sx={{
                    p: {xs: 2, sm: 3},
                    mb: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}14 0%, ${theme.palette.primary.main}08 100%)`,
                }}
            >
                <Box display="flex" alignItems={{xs: 'flex-start', sm: 'center'}} gap={2} flexWrap="wrap">
                    <Box display="flex" alignItems="center" gap={1.5}>
                        {iconMap[value]}
                        <Typography variant="h5" fontWeight={700}>{heading}</Typography>
                    </Box>
                    <Box flexGrow={1} />
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1.5}>{subheading}</Typography>
            </Paper>

            {/* Sticky Tabs */}
            <Paper
                variant="outlined"
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: (t) => t.zIndex.appBar - 1,
                    mb: 2,
                    borderRadius: 2,
                }}
            >
                <Tabs
                    value={value}
                    onChange={handleChange}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    aria-label="Admin section navigation"
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{
                        px: 1,
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 },
                    }}
                >
                    <Tab iconPosition="start" icon={<GroupsIcon fontSize="small"/>} label="Manage Groups" value="manage-groups"/>
                    <Tab iconPosition="start" icon={<WorkspacePremiumIcon fontSize="small"/>} label="Manage Roles" value="manage-roles"/>
                    <Tab iconPosition="start" icon={<VpnKeyIcon fontSize="small"/>} label="Manage Permissions" value="manage-permissions"/>
                    <Tab iconPosition="start" icon={<PeopleIcon fontSize="small"/>} label="Manage Users" value="manage-users"/>
                    <Tab iconPosition="start" icon={<SecurityIcon fontSize="small"/>} label="Manage Security" value="manage-security"/>
                    <Tab iconPosition="start" icon={<SettingsIcon fontSize="small"/>} label="Tenant Settings" value="tenant-settings"/>
                </Tabs>
            </Paper>

            {/* Page Content */}
            {children}
        </Box>
    );
}