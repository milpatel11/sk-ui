"use client";
import React, {useCallback, useEffect, useState} from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/CancelOutlined';
import SearchIcon from '@mui/icons-material/Search';
import {apiClient} from '@/lib/apiClient';
import {useTenants} from './TenantContext';

interface InvitationDto {
    invitation_id: string;
    tenant_id: string;
    tenant_name: string;
    role_names?: string[];
    status?: string;
}

interface JoinRequestDto {
    request_id: string;
    tenant_id: string;
    tenant_name: string;
    status: string;
}

interface TenantLite {
    tenant_id: string;
    tenant_name: string;
    tenant_description?: string | null;
}

const panelPaperSx = {
    p: 2.5,
    borderRadius: 2,
    background: (t: any) => t.palette.mode === 'light' ? '#ffffff' : t.palette.background.paper,
    border: (t: any) => `1px solid ${t.palette.divider}`,
    display: 'flex', flexDirection: 'column', gap: 1.5
};

const TenantOnboardingPanel: React.FC = () => {
    const {addTenant, setActiveTenantId} = useTenants();
    const [invitations, setInvitations] = useState<InvitationDto[]>([]);
    const [loadingInv, setLoadingInv] = useState(false);
    const [errorInv, setErrorInv] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<TenantLite[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [joinRequests, setJoinRequests] = useState<JoinRequestDto[]>([]);
    const [joinReqLoading, setJoinReqLoading] = useState(false);

    const loadInvitations = useCallback(async () => {
        setLoadingInv(true);
        setErrorInv(null);
        try {
            const resp = await apiClient.get('/invitations');
            setInvitations(Array.isArray(resp.data) ? resp.data : []);
        } catch (e: any) {
            setErrorInv(e.message || 'Failed to load invitations');
        } finally {
            setLoadingInv(false);
        }
    }, []);

    const loadJoinRequests = useCallback(async () => {
        try {
            const resp = await apiClient.get('/tenant-join-requests');
            setJoinRequests(Array.isArray(resp.data) ? resp.data : []);
        } catch { /* ignore */
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (search.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        let active = true;
        const handle = setTimeout(async () => {
            setSearchLoading(true);
            setSearchError(null);
            try {
                const resp = await apiClient.get(`/tenant-search?q=${encodeURIComponent(search.trim())}`);
                if (!active) return;
                const list = Array.isArray(resp.data) ? resp.data : [];
                // Normalize list entries
                const normalized: TenantLite[] = list.map((t: any) => ({
                    tenant_id: t.tenant_id || t.tenantId || t.id,
                    tenant_name: t.tenant_name || t.tenantName || t.name,
                    tenant_description: t.tenant_description || t.description || null
                })).filter((x: TenantLite) => x.tenant_id && x.tenant_name);
                setSearchResults(normalized);
            } catch (e: any) {
                if (active) setSearchError(e.message || 'Search failed');
            } finally {
                if (active) setSearchLoading(false);
            }
        }, 450);
        return () => {
            active = false;
            clearTimeout(handle);
        };
    }, [search]);

    useEffect(() => {
        loadInvitations();
        loadJoinRequests();
    }, [loadInvitations, loadJoinRequests]);

    const accept = async (id: string) => {
        try {
            await apiClient.post(`/invitations/${id}/accept`);
            // After accept, optimistic update status
            setInvitations(prev => prev.filter(i => i.invitation_id !== id));
            // Refresh tenants list from backend core if endpoint exists; fallback create minimal tenant
            try {
                const tResp = await apiClient.get('/tenants');
                // noop – TenantContext effect should refresh automatically elsewhere if relying on this call
                if (!tResp) {/* silence */
                }
            } catch {/* ignore */
            }
        } catch {/* ignore */
        }
    };
    const decline = async (id: string) => {
        try {
            await apiClient.post(`/invitations/${id}/decline`);
            setInvitations(prev => prev.filter(i => i.invitation_id !== id));
        } catch {/* ignore */
        }
    };

    const hasRequested = (tenantId: string) => joinRequests.some(r => r.tenant_id === tenantId && r.status === 'PENDING');

    const requestJoin = async (tenantId: string) => {
        setJoinReqLoading(true);
        try {
            const resp = await apiClient.post('/tenant-join-requests', {tenantId});
            if (resp.data) setJoinRequests(r => [...r, resp.data]);
        } catch {/* ignore */
        } finally {
            setJoinReqLoading(false);
        }
    };

    return (
        <Stack spacing={3} sx={{mb: 0}}>
            <Paper elevation={0} sx={panelPaperSx}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight={600}>Invitations</Typography>
                    <Tooltip title="Refresh">
            <span>
              <IconButton size="small" onClick={loadInvitations} disabled={loadingInv}>
                {loadingInv ? <CircularProgress size={16}/> : <RefreshIcon fontSize="small"/>}
              </IconButton>
            </span>
                    </Tooltip>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{mb: 1}}>
                    Accept or decline pending invitations to quickly gain access.
                </Typography>
                {loadingInv && (
                    <List dense>
                        {Array.from({length: 2}).map((_, i) => (
                            <ListItem key={i} disableGutters>
                                <Box width="100%" display="flex" flexDirection="column" gap={0.5}>
                                    <Skeleton variant="text" width="70%" height={20}/>
                                    <Skeleton variant="rectangular" height={8} width={120} sx={{borderRadius: 1}}/>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                )}
                {errorInv && !loadingInv && <Typography color="error" variant="body2">{errorInv}</Typography>}
                {!loadingInv && !invitations.length && !errorInv && (
                    <Box textAlign="center" py={1}>
                        <Typography variant="body2" color="text.secondary">No pending invitations</Typography>
                    </Box>
                )}
                {!!invitations.length && !loadingInv && (
                    <List dense sx={{mt: 0.5}}>
                        {invitations.map(inv => (
                            <ListItem key={inv.invitation_id} divider sx={{px: 0}}>
                                <ListItemText
                                    primary={<Box display="flex" alignItems="center" gap={0.75}><Typography
                                        variant="body2"
                                        fontWeight={600}>{inv.tenant_name}</Typography>{inv.role_names?.map(r => <Chip
                                        key={r} size="small" label={r}/>)}</Box>}
                                    secondary={<Typography variant="caption"
                                                           color="text.secondary">{inv.status || 'PENDING'}</Typography>}
                                />
                                <ListItemSecondaryAction>
                                    <Stack direction="row" spacing={1}>
                                        <Button size="small" color="primary" variant="contained"
                                                onClick={() => accept(inv.invitation_id)}
                                                startIcon={<CheckIcon fontSize="inherit"/>}
                                                sx={{textTransform: 'none', fontSize: 12, py: 0.5}}>Accept</Button>
                                        <Button size="small" color="inherit" variant="outlined"
                                                onClick={() => decline(inv.invitation_id)}
                                                startIcon={<CloseIcon fontSize="inherit"/>}
                                                sx={{textTransform: 'none', fontSize: 12, py: 0.5}}>Decline</Button>
                                    </Stack>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>

            <Paper elevation={0} sx={panelPaperSx}>
                <Typography variant="subtitle1" fontWeight={600}>Find Existing Tenants</Typography>
                <Typography variant="caption" color="text.secondary">Search for a tenant and request access if you are
                    not invited yet.</Typography>
                <TextField
                    placeholder="Search tenants (min 2 characters)"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                        startAdornment: <SearchIcon fontSize="small" style={{marginRight: 4, opacity: 0.65}}/>
                    }}
                />
                {searchLoading &&
                    <Box mt={1} display="flex" alignItems="center" gap={1}><CircularProgress size={18}/> <Typography
                        variant="caption">Searching...</Typography></Box>}
                {searchError && <Typography mt={1} color="error" variant="body2">{searchError}</Typography>}
                {!searchLoading && !!searchResults.length && (
                    <List dense sx={{
                        mt: 0.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        maxHeight: 300,
                        overflowY: 'auto'
                    }}>
                        {searchResults.map(t => {
                            const requested = hasRequested(t.tenant_id);
                            return (
                                <ListItem key={t.tenant_id} divider={false} sx={{
                                    px: 1,
                                    '&:not(:last-of-type)': {borderBottom: '1px solid', borderColor: 'divider'}
                                }} secondaryAction={
                                    <Button
                                        size="small"
                                        disabled={requested || joinReqLoading}
                                        variant={requested ? 'outlined' : 'contained'}
                                        onClick={() => !requested && requestJoin(t.tenant_id)}
                                        sx={{textTransform: 'none', fontSize: 12, py: 0.5}}
                                    >
                                        {requested ? 'Requested' : 'Request'}
                                    </Button>
                                }>
                                    <ListItemText primary={<Typography variant="body2"
                                                                       fontWeight={500}>{t.tenant_name}</Typography>}
                                                  secondary={<Typography variant="caption"
                                                                         color="text.secondary">{t.tenant_description || ' '}</Typography>}/>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
                {!searchLoading && search.trim().length >= 2 && !searchResults.length && !searchError && (
                    <Typography variant="body2" color="text.secondary" mt={1}>No tenants found.</Typography>
                )}
                <Divider flexItem sx={{my: 1.5}}/>
                <Typography variant="caption" color="text.secondary">Prefer your own space? Create a tenant on the
                    right.</Typography>
            </Paper>
        </Stack>
    );
};

export default TenantOnboardingPanel;