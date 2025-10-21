"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, CardHeader, Divider, Grid, Stack, TextField, Typography, Alert, Chip, IconButton, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { apiClient } from '@/lib/apiClient';
import { useTenants } from './TenantContext';

interface TenantDraft {
  tenant_name: string;
  tenant_description?: string | null;
  billing_address_line1?: string; billing_address_line2?: string; billing_city?: string; billing_state?: string; billing_postal_code?: string; billing_country?: string;
  shipping_address_line1?: string; shipping_address_line2?: string; shipping_city?: string; shipping_state?: string; shipping_postal_code?: string; shipping_country?: string;
}
interface InvitationRow {
  invitation_id: string; invited_email?: string | null; invited_username?: string | null; status?: string; created_at?: string; tenant_id: string;
}

const emptyDraft: TenantDraft = { tenant_name: '' };

export const ManageTenantPanel: React.FC = () => {
  const { tenants, activeTenantId } = useTenants();
  const current = useMemo(()=> tenants.find(t=>t.tenant_id === activeTenantId), [tenants, activeTenantId]);
  const [draft, setDraft] = useState<TenantDraft>(emptyDraft);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const loadInvitations = async () => {
    if (!activeTenantId) return;
    setLoadingInvites(true); setInviteError(null);
    try {
      const resp = await apiClient.get(`/tenant-invitations?tenantId=${activeTenantId}`);
      setInvitations(Array.isArray(resp.data) ? resp.data : []);
    } catch (e:any) {
      setInviteError(e.message || 'Failed to load invitations');
    } finally { setLoadingInvites(false); }
  };

  useEffect(()=>{ if (current) {
    const d: TenantDraft = {
      tenant_name: current.tenant_name,
      tenant_description: current.tenant_description || '',
      billing_address_line1: current.billing_address_line1 || '',
      billing_address_line2: current.billing_address_line2 || '',
      billing_city: current.billing_city || '',
      billing_state: current.billing_state || '',
      billing_postal_code: current.billing_postal_code || '',
      billing_country: current.billing_country || '',
      shipping_address_line1: current.shipping_address_line1 || '',
      shipping_address_line2: current.shipping_address_line2 || '',
      shipping_city: current.shipping_city || '',
      shipping_state: current.shipping_state || '',
      shipping_postal_code: current.shipping_postal_code || '',
      shipping_country: current.shipping_country || '',
    };
    setDraft(d); setDirty(false); setSaveMsg(null); setError(null);
    loadInvitations();
  }}, [current]);

  const onChange = (k:keyof TenantDraft, v:string) => { setDraft(d => ({...d, [k]: v})); setDirty(true); };

  const save = async () => {
    if (!activeTenantId) return;
    setSaving(true); setError(null); setSaveMsg(null);
    try {
      await apiClient.patch(`/tenants/${activeTenantId}`, draft);
      setDirty(false);
      setSaveMsg('Saved');
      setTimeout(()=>setSaveMsg(null), 2500);
    } catch(e:any) {
      setError(e.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const invite = async () => {
    if (!activeTenantId) return;
    if (!inviteEmail.trim() && !inviteUsername.trim()) { setInviteError('Provide email or username'); return; }
    setInviting(true); setInviteError(null);
    try {
      await apiClient.post('/tenant-invitations', { tenantId: activeTenantId, email: inviteEmail.trim() || undefined, username: inviteUsername.trim() || undefined });
      setInviteEmail(''); setInviteUsername('');
      loadInvitations();
    } catch(e:any) {
      setInviteError(e.message || 'Invite failed');
    } finally { setInviting(false); }
  };

  if (!activeTenantId || !current) {
    return <Alert severity="info">Select or create a tenant first.</Alert>;
  }

  return (
    <Stack spacing={4}>
      <Card variant="outlined">
        <CardHeader title={<Typography variant="h6">Tenant Profile</Typography>} subheader="Update name, description and addresses" />
        <Divider />
        <CardContent>
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Tenant Name" value={draft.tenant_name} onChange={e=>onChange('tenant_name', e.target.value)} fullWidth size="small" required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Description" value={draft.tenant_description} onChange={e=>onChange('tenant_description', e.target.value)} fullWidth size="small" />
              </Grid>
            </Grid>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Billing Address</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><TextField label="Address Line 1" value={draft.billing_address_line1} onChange={e=>onChange('billing_address_line1', e.target.value)} fullWidth size="small" /></Grid>
                <Grid item xs={12} md={6}><TextField label="Address Line 2" value={draft.billing_address_line2} onChange={e=>onChange('billing_address_line2', e.target.value)} fullWidth size="small" /></Grid>
                <Grid item xs={6} md={3}><TextField label="City" value={draft.billing_city} onChange={e=>onChange('billing_city', e.target.value)} fullWidth size="small" /></Grid>
                <Grid item xs={6} md={3}><TextField label="State" value={draft.billing_state} onChange={e=>onChange('billing_state', e.target.value)} fullWidth size="small" /></Grid>
                <Grid item xs={6} md={3}><TextField label="Postal Code" value={draft.billing_postal_code} onChange={e=>onChange('billing_postal_code', e.target.value)} fullWidth size="small" /></Grid>
                <Grid item xs={6} md={3}><TextField label="Country" value={draft.billing_country} onChange={e=>onChange('billing_country', e.target.value)} fullWidth size="small" /></Grid>
              </Grid>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Shipping Address</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><TextField label="Address Line 1" value={draft.shipping_address_line1} onChange={e=>onChange('shipping_address_line1', e.target.value)} fullWidth size="small" /></Grid>
                <Grid item xs={12} md={6}><TextField label="Address Line 2" value={draft.shipping_address_line2} onChange={e=>onChange('shipping_address_line2', e.target.value)} fullWidth size="small" /></Grid>
                <Grid item xs={6} md={3}><TextField label="City" value={draft.shipping_city} onChange={e=>onChange('shipping_city', e.target.value)} fullWidth size="small" /></Grid>
                <Grid item xs={6} md={3}><TextField label="State" value={draft.shipping_state} onChange={e=>onChange('shipping_state', e.target.value)} fullWidth size="small" /></Grid>
                <Grid item xs={6} md={3}><TextField label="Postal Code" value={draft.shipping_postal_code} onChange={e=>onChange('shipping_postal_code', e.target.value)} fullWidth size="small" /></Grid>
                <Grid item xs={6} md={3}><TextField label="Country" value={draft.shipping_country} onChange={e=>onChange('shipping_country', e.target.value)} fullWidth size="small" /></Grid>
              </Grid>
            </Box>
            {error && <Alert severity="error" variant="outlined">{error}</Alert>}
            <Box display="flex" gap={2} alignItems="center">
              <Button variant="contained" disabled={!dirty || saving} onClick={save} sx={{ textTransform:'none' }}>{saving? 'Saving...' : 'Save Changes'}</Button>
              {saveMsg && <Typography variant="body2" color="success.main">{saveMsg}</Typography>}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title={<Typography variant="h6">Invite Users</Typography>} subheader="Invite by email or username" action={<IconButton size="small" onClick={loadInvitations} disabled={loadingInvites}>{loadingInvites? <CircularProgress size={18}/> : <RefreshIcon fontSize="small" />}</IconButton>} />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}><TextField label="Email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} fullWidth size="small" placeholder="user@example.com" /></Grid>
              <Grid item xs={12} md={5}><TextField label="Username" value={inviteUsername} onChange={e=>setInviteUsername(e.target.value)} fullWidth size="small" placeholder="optional" /></Grid>
              <Grid item xs={12} md={2} display="flex" alignItems="flex-start"><Button fullWidth variant="contained" disabled={inviting} onClick={invite} sx={{ textTransform:'none' }}>{inviting? 'Sending...' : 'Invite'}</Button></Grid>
            </Grid>
            {inviteError && <Alert severity="error" variant="outlined">{inviteError}</Alert>}
            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">Pending Invitations</Typography>
              {!invitations.length && !loadingInvites && <Typography variant="body2" color="text.secondary">None</Typography>}
              {invitations.map(inv => (
                <Box key={inv.invitation_id} display="flex" alignItems="center" gap={1} border={1} borderColor="divider" px={1.5} py={0.75} borderRadius={1}>
                  <Typography variant="body2" flexGrow={1}>{inv.invited_email || inv.invited_username}</Typography>
                  <Chip size="small" label={inv.status || 'PENDING'} color={inv.status==='ACCEPTED'? 'success': inv.status==='DECLINED' ? 'default':'warning'} />
                </Box>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ManageTenantPanel;
