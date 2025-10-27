"use client";
import React from 'react';
import {
    Box,
    Button,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography
} from '@mui/material';
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

export const AuthGraphForm: React.FC<{ hideTitle?: boolean }> = ({ hideTitle = false }) => {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [apps, setApps] = React.useState<Application[]>([]);
    const [users, setUsers] = React.useState<GlobalUser[]>([]);
    const [groups, setGroups] = React.useState<Group[]>([]);
    const [roles, setRoles] = React.useState<Role[]>([]);
    const [permissions, setPermissions] = React.useState<Permission[]>([]);
    const [applicationUsers, setApplicationUsers] = React.useState<ApplicationUser[]>([]);
    const [userGroups, setUserGroups] = React.useState<UserGroup[]>([]);
    const [groupRoles, setGroupRoles] = React.useState<GroupRole[]>([]);
    const [rolePermissions, setRolePermissions] = React.useState<RolePermission[]>([]);

    const [selectedUser, setSelectedUser] = React.useState<string>('');
    const [selectedApplication, setSelectedApplication] = React.useState<string>('');
    const [selectedGroupIds, setSelectedGroupIds] = React.useState<string[]>([]);
    const [selectedAppRoleIds, setSelectedAppRoleIds] = React.useState<string[]>([]);
    const [selectedGroupRoleIds, setSelectedGroupRoleIds] = React.useState<string[]>([]);
    const [selectedRolePermissionIds, setSelectedRolePermissionIds] = React.useState<string[]>([]);

    const loadAll = React.useCallback(async () => {
        setLoading(true);
        try {
            const [appsR, usersR, groupsR, rolesR, permsR, appUsersR, userGroupsR, groupRolesR, rolePermsR] = await Promise.all([
                apiClient.get('/applications'),
                apiClient.get('/users'),
                apiClient.get('/groups'),
                apiClient.get('/roles'),
                apiClient.get('/permissions'),
                apiClient.get('/application-users'),
                apiClient.get('/user-groups'),
                apiClient.get('/group-roles'),
                apiClient.get('/role-permissions')
            ]);
            setApps(appsR.data || []);
            setUsers(usersR.data || []);
            setGroups(groupsR.data || []);
            setRoles(rolesR.data || []);
            setPermissions(permsR.data || []);
            setApplicationUsers(appUsersR.data || []);
            setUserGroups(userGroupsR.data || []);
            setGroupRoles(groupRolesR.data || []);
            setRolePermissions(rolePermsR.data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadAll();
    }, [loadAll]);

    // When selections change, hydrate form state from graph edges
    React.useEffect(() => {
        if (!selectedUser) {
            setSelectedGroupIds([]);
            setSelectedAppRoleIds([]);
            setSelectedGroupRoleIds([]);
            setSelectedRolePermissionIds([]);
            return;
        }
        const userGroupEdges = userGroups.filter(ug => ug.user_id === selectedUser).map(ug => ug.group_id);
        setSelectedGroupIds(userGroupEdges);
    }, [selectedUser, userGroups]);

    React.useEffect(() => {
        if (!selectedApplication || !selectedUser) {
            setSelectedAppRoleIds([]);
            return;
        }
        const appEntry = applicationUsers.find(au => au.user_id === selectedUser && au.application_id === selectedApplication);
        setSelectedAppRoleIds(appEntry ? appEntry.role_ids : []);
    }, [selectedApplication, selectedUser, applicationUsers]);

    React.useEffect(() => {
        // Roles derived from selected groups
        const groupRoleIds = groupRoles.filter(gr => selectedGroupIds.includes(gr.group_id)).map(gr => gr.role_id);
        setSelectedGroupRoleIds(groupRoleIds);
    }, [selectedGroupIds, groupRoles]);

    React.useEffect(() => {
        // Permissions derived from roles (both group derived + app direct roles)
        const allRoleIds = Array.from(new Set([...selectedGroupRoleIds, ...selectedAppRoleIds]));
        const permIds = rolePermissions.filter(rp => allRoleIds.includes(rp.role_id)).map(rp => rp.permission_id);
        setSelectedRolePermissionIds(Array.from(new Set(permIds)));
    }, [selectedGroupRoleIds, selectedAppRoleIds, rolePermissions]);

    const appScopedRoles = React.useMemo(() => roles.filter(r => r.scope === 'APPLICATION'), [roles]);

    const saveApplicationRoles = async () => {
        if (!selectedApplication || !selectedUser) return;
        setSaving(true);
        try {
            await apiClient.put(`/application-users/${selectedApplication}/${selectedUser}`, {role_ids: selectedAppRoleIds});
            await loadAll();
        } finally {
            setSaving(false);
        }
    };

    // NOTE: For brevity CRUD for user-groups etc not implemented yet.

    return (
        <Paper sx={{p: 3}}>
            {!hideTitle && (
                <>
                    <Typography variant="h5" gutterBottom>Authorization Graph Management</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Configure relationships in a single linear flow (User → Groups → Roles → Permissions, plus Application
                        membership & app roles).
                    </Typography>
                </>
            )}
            <Stack spacing={3}>
                <Box>
                    <Typography variant="subtitle2" gutterBottom>1. Select User</Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel id="user-select">User</InputLabel>
                        <Select labelId="user-select" label="User" value={selectedUser}
                                onChange={e => setSelectedUser(e.target.value)}>
                            {users.map(u => <MenuItem key={u.user_id}
                                                      value={u.user_id}>{u.username || u.email || u.user_id}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
                <Divider/>
                <Box>
                    <Typography variant="subtitle2" gutterBottom>2. Assign Groups (derived roles auto-calc)</Typography>
                    <FormControl fullWidth size="small" disabled={!selectedUser}>
                        <InputLabel id="groups-select">Groups</InputLabel>
                        <Select
                            multiple
                            labelId="groups-select"
                            label="Groups"
                            value={selectedGroupIds}
                            onChange={e => setSelectedGroupIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            renderValue={(selected) => (
                                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                    {(selected as string[]).map(id => {
                                        const g = groups.find(gr => gr.group_id === id);
                                        return <Chip key={id} label={g?.group_name || id} size="small"/>;
                                    })}
                                </Box>
                            )}
                        >
                            {groups.map(g => <MenuItem key={g.group_id} value={g.group_id}>{g.group_name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
                <Divider/>
                <Box>
                    <Typography variant="subtitle2" gutterBottom>3. Select Application Membership & Roles</Typography>
                    <Stack direction={{xs: 'column', md: 'row'}} spacing={2}>
                        <FormControl fullWidth size="small" disabled={!selectedUser}>
                            <InputLabel id="app-select">Application</InputLabel>
                            <Select labelId="app-select" label="Application" value={selectedApplication}
                                    onChange={e => setSelectedApplication(e.target.value)}>
                                {apps.map(a => <MenuItem key={a.application_id}
                                                         value={a.application_id}>{a.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small" disabled={!selectedApplication || !selectedUser}>
                            <InputLabel id="app-roles-select">App Roles</InputLabel>
                            <Select
                                multiple
                                labelId="app-roles-select"
                                label="App Roles"
                                value={selectedAppRoleIds}
                                onChange={e => setSelectedAppRoleIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                renderValue={(selected) => (
                                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                        {(selected as string[]).map(id => {
                                            const r = appScopedRoles.find(ar => ar.role_id === id);
                                            return <Chip key={id} label={r?.name || id} size="small"/>;
                                        })}
                                    </Box>
                                )}
                            >
                                {appScopedRoles.map(r => <MenuItem key={r.role_id}
                                                                   value={r.role_id}>{r.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Stack>
                    <Box mt={1}>
                        <Button size="small" variant="contained"
                                disabled={!selectedApplication || !selectedUser || saving}
                                onClick={saveApplicationRoles}>Save App Roles</Button>
                    </Box>
                </Box>
                <Divider/>
                <Box>
                    <Typography variant="subtitle2" gutterBottom>4. Derived Roles</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                        {Array.from(new Set([...selectedGroupRoleIds, ...selectedAppRoleIds])).map(rid => {
                            const r = roles.find(ro => ro.role_id === rid);
                            return <Chip key={rid} label={r?.name || rid}/>;
                        })}
                        {(!selectedGroupRoleIds.length && !selectedAppRoleIds.length) &&
                            <Typography variant="caption" color="text.secondary">No roles yet</Typography>}
                    </Stack>
                </Box>
                <Divider/>
                <Box>
                    <Typography variant="subtitle2" gutterBottom>5. Effective Permissions</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                        {selectedRolePermissionIds.map(pid => {
                            const p = permissions.find(pe => pe.permission_id === pid);
                            return <Chip key={pid} label={p?.name || pid} color="primary" variant="outlined"/>;
                        })}
                        {!selectedRolePermissionIds.length &&
                            <Typography variant="caption" color="text.secondary">No permissions</Typography>}
                    </Stack>
                </Box>
            </Stack>
            {(loading || saving) && <Typography mt={3} variant="caption"
                                                color="text.secondary">{loading ? 'Loading graph...' : 'Saving...'}</Typography>}
        </Paper>
    );
};