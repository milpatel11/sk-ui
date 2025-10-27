"use client";
import React, {useEffect} from 'react';
import {useAuth} from '@/features/auth/AuthContext';
import {usePathname, useRouter} from 'next/navigation';
import {AppBar, Box, Breadcrumbs, Button, Divider, Link as MLink, Toolbar, Typography} from '@mui/material';
import NextLink from 'next/link';
import AppsIcon from '@mui/icons-material/Apps';
import {useTenants} from '@/features/tenants/TenantContext';

interface ProtectedLayoutProps {
    children: React.ReactNode;
    title?: string;
    breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({children, title, breadcrumbs}) => {
    const {isAuthenticated, logout, ready} = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const {tenants, activeTenantId, setActiveTenantId} = useTenants();

    // Detect tenant-scoped path: /tenant/[tenantId]/...
    const pathSegments = pathname.split('/').filter(Boolean);
    const isTenantScoped = pathSegments[0] === 'tenant';
    const routeTenantId = isTenantScoped ? pathSegments[1] : null;

    // Enforce tenant lock: if route tenant id differs from locked stored id, redirect
    useEffect(() => {
        if (!isAuthenticated || !ready) return;
        const lockedId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
        if (isTenantScoped) {
            if (!lockedId && routeTenantId) {
                // First time entering with explicit tenant param: lock it
                localStorage.setItem('tenantId', routeTenantId);
                setActiveTenantId(routeTenantId);
            } else if (lockedId && routeTenantId && lockedId !== routeTenantId) {
                router.replace(`/tenant/${lockedId}`);
            } else if (lockedId && !routeTenantId) {
                router.replace(`/tenant/${lockedId}`);
            }
        } else {
            // Non-tenant-scoped route while authenticated: redirect into locked tenant if exists
            // Allow visiting the Lobby route even when a tenant is locked
            const isLobby = pathname.startsWith('/lobby');
            if (lockedId && !isLobby) router.replace(`/tenant/${lockedId}`);
        }
    }, [isAuthenticated, ready, routeTenantId, isTenantScoped, router, pathname]);

    // Build breadcrumbs for tenant-scoped paths
    const autoCrumbs = React.useMemo(() => {
        if (isTenantScoped) {
            if (!routeTenantId) return [];
            const tenantName = tenants.find(t => t.tenant_id === routeTenantId)?.tenant_name || 'Tenant';
            const segments = pathSegments.slice(2);
            const list: Array<{ label: string; href?: string }> = [];
            list.push({label: tenantName, href: `/tenant/${routeTenantId}`});
            let accum = `/tenant/${routeTenantId}`;
            segments.forEach((seg, idx) => {
                accum += `/${seg}`;
                const isLast = idx === segments.length - 1;
                list.push({label: seg.replace(/[-_]/g, ' '), href: isLast ? undefined : accum});
            });
            return list;
        }
        if (breadcrumbs) return breadcrumbs;
        return [];
    }, [breadcrumbs, isTenantScoped, routeTenantId, pathSegments, tenants]);

    const tenantNameDisplay = isTenantScoped && routeTenantId ? (tenants.find(t => t.tenant_id === routeTenantId)?.tenant_name || routeTenantId) : null;

    return (
        <Box display="flex" flexDirection="column" minHeight="100vh">
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar sx={{gap: 2, minHeight: 56}}>
                    <AppsIcon fontSize="small"/>
                    <Typography variant="h6" sx={{flexShrink: 0, fontSize: {xs: 16, sm: 18}}}>
                        {tenantNameDisplay ? `${tenantNameDisplay}` : 'Identity Suite'}{title ? ' · ' + title : ''}
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{mx: 1}}/>
                    <Box flexGrow={1}/>
                    <Button size="small" component={NextLink} href="/lobby">Lobby</Button>
                    <Button size="small" onClick={() => {
                        logout();
                        router.push('/login');
                    }}>Logout</Button>
                </Toolbar>
            </AppBar>
            <Box component="main" flexGrow={1} p={3}>
                {autoCrumbs.length > 0 && (
                    <Breadcrumbs aria-label="breadcrumb" sx={{mb: 2, fontSize: 13}}>
                        {autoCrumbs.map((c, i) => {
                            const isLast = i === autoCrumbs.length - 1;
                            if (!c.href || isLast) return <Typography key={i} color="text.primary"
                                                                      sx={{textTransform: 'capitalize'}}>{c.label}</Typography>;
                            return <MLink key={i} component={NextLink} underline="hover" color="inherit" href={c.href}
                                          sx={{textTransform: 'capitalize'}}>{c.label}</MLink>;
                        })}
                    </Breadcrumbs>
                )}
                {children}
            </Box>
        </Box>
    );
};