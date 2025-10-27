"use client";
import React, {useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import {Box, Button, Chip, Paper, Stack, Typography} from '@mui/material';
import {apiClient} from '@/lib/apiClient';
import {
    Application,
    ApplicationUser,
    GlobalUser,
    Group,
    GroupRole,
    Permission,
    Role,
    RolePermission,
    UserGroup
} from '@/lib/types';
import Link from 'next/link';

export default function UserDrillDownPage() {
    const params = useParams();
    const userId = params?.userId as string;
    const [user, setUser] = useState<GlobalUser | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
    const [groupRoles, setGroupRoles] = useState<GroupRole[]>([]);
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [applicationUsers, setApplicationUsers] = useState<ApplicationUser[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;
        const load = async () => {
            setLoading(true);
            try {
                const [userR, appsR, groupsR, rolesR, permsR, userGroupsR, groupRolesR, rolePermsR, appUsersR] = await Promise.all([
                    apiClient.get(`/users/${userId}`),
                    apiClient.get('/applications'),
                    apiClient.get('/groups'),
                    apiClient.get('/roles'),
                    apiClient.get('/permissions'),
                    apiClient.get('/user-groups'),
                    apiClient.get('/group-roles'),
                    apiClient.get('/role-permissions'),
                    apiClient.get('/application-users')
                ]);
                setUser(userR.data || null);
                setApplications(appsR.data || []);
                setGroups(groupsR.data || []);
                setRoles(rolesR.data || []);
                setPermissions(permsR.data || []);
                setUserGroups(userGroupsR.data || []);
                setGroupRoles(groupRolesR.data || []);
                setRolePermissions(rolePermsR.data || []);
                setApplicationUsers(appUsersR.data || []);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    const userGroupIds = userGroups.filter(ug => ug.user_id === userId).map(ug => ug.group_id);
    const derivedRoleIdsFromGroups = groupRoles.filter(gr => userGroupIds.includes(gr.group_id)).map(gr => gr.role_id);
    const appRoleIds = applicationUsers.filter(au => au.user_id === userId).flatMap(au => au.role_ids);
    const effectiveRoleIds = Array.from(new Set([...derivedRoleIdsFromGroups, ...appRoleIds]));
    const effectivePermissionIds = rolePermissions.filter(rp => effectiveRoleIds.includes(rp.role_id)).map(rp => rp.permission_id);
    const effectivePermissions = Array.from(new Set(effectivePermissionIds)).map(pid => permissions.find(p => p.permission_id === pid)).filter(Boolean) as Permission[];
    const appIds = applicationUsers.filter(au => au.user_id === userId).map(au => au.application_id);
    const accessibleAppEntities = applications.filter(a => appIds.includes(a.application_id));

    return (
        <Box maxWidth={1200} mx="auto" py={1}>
            <Button component={Link} href="/apps/user-management/users" size="small" variant="outlined" sx={{mb: 2}}>Back
                to Users</Button>
            {!user && (loading ? <Typography variant="body2">Loading...</Typography> :
                <Typography variant="body2">User not found.</Typography>)}
            {user && (
                <Stack spacing={3}>
                    <Paper sx={{p: 2}}>
                        <Typography variant="subtitle1" gutterBottom>Profile</Typography>
                        <Stack spacing={1}>
                            <Typography variant="body2"><strong>Username:</strong> {user.username || '—'}</Typography>
                            <Typography variant="body2"><strong>Email:</strong> {user.email || '—'}</Typography>
                            <Typography variant="body2"><strong>Tenant:</strong> {user.tenant_id || '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">User ID: {user.user_id}</Typography>
                        </Stack>
                    </Paper>
                    <Paper sx={{p: 2}}>
                        <Typography variant="subtitle1" gutterBottom>Groups</Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {userGroupIds.map(gid => {
                                const g = groups.find(gr => gr.group_id === gid);
                                return <Chip key={gid} label={g?.group_name || gid} size="small"/>;
                            })}
                            {!userGroupIds.length &&
                                <Typography variant="caption" color="text.secondary">No groups</Typography>}
                        </Stack>
                    </Paper>
                    <Paper sx={{p: 2}}>
                        <Typography variant="subtitle1" gutterBottom>Roles</Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {effectiveRoleIds.map(rid => {
                                const r = roles.find(ro => ro.role_id === rid);
                                return <Chip key={rid} label={r?.name || rid} size="small"/>;
                            })}
                            {!effectiveRoleIds.length &&
                                <Typography variant="caption" color="text.secondary">No roles</Typography>}
                        </Stack>
                    </Paper>
                    <Paper sx={{p: 2}}>
                        <Typography variant="subtitle1" gutterBottom>Permissions</Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {effectivePermissions.map(p => <Chip key={p.permission_id} label={p.name} size="small"
                                                                 color="primary" variant="outlined"/>)}
                            {!effectivePermissions.length &&
                                <Typography variant="caption" color="text.secondary">No permissions</Typography>}
                        </Stack>
                    </Paper>
                    <Paper sx={{p: 2}}>
                        <Typography variant="subtitle1" gutterBottom>Applications</Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {accessibleAppEntities.map(app => <Chip key={app.application_id} label={app.name}
                                                                    size="small"/>)}
                            {!accessibleAppEntities.length &&
                                <Typography variant="caption" color="text.secondary">No applications</Typography>}
                        </Stack>
                    </Paper>
                </Stack>
            )}
        </Box>
    );
}
