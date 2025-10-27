"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CardHeader, Divider, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { useTenants } from './TenantContext';

interface TenantConfigDraft {
  defaultCurrency: string;
  timeZone: string;
  locale: string;
  dateFormat: string;
  primaryColor: string;
  enableApprovals: boolean;
  enforce2FA: boolean;
}

const defaults: TenantConfigDraft = {
  defaultCurrency: 'USD',
  timeZone: 'UTC',
  locale: 'en-US',
  dateFormat: 'YYYY-MM-DD',
  primaryColor: '#1976d2',
  enableApprovals: true,
  enforce2FA: false,
};

function keyFor(tenantId: string) { return `tenantConfig:${tenantId}`; }

export default function TenantConfigurationsPanel() {
  const { activeTenantId } = useTenants();
  const [draft, setDraft] = useState<TenantConfigDraft>(defaults);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTenantId) return;
    try {
      const raw = localStorage.getItem(keyFor(activeTenantId));
      if (raw) {
        const parsed = JSON.parse(raw);
        setDraft({ ...defaults, ...parsed });
      } else {
        setDraft(defaults);
      }
      setDirty(false);
      setMsg(null);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load configuration');
    }
  }, [activeTenantId]);

  const onChange = <K extends keyof TenantConfigDraft>(k: K, v: TenantConfigDraft[K]) => {
    setDraft(d => ({ ...d, [k]: v }));
    setDirty(true);
  };

  const save = async () => {
    if (!activeTenantId) return;
    setSaving(true); setError(null); setMsg(null);
    try {
      // Persist locally for now; wire to API when available
      localStorage.setItem(keyFor(activeTenantId), JSON.stringify(draft));
      setDirty(false);
      setMsg('Saved');
      setTimeout(() => setMsg(null), 2000);
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (!activeTenantId) return <Alert severity="info">Select a tenant first.</Alert>;

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardHeader title={<Typography variant="h6">Core Settings</Typography>} subheader="Defaults and formatting" />
        <Divider/>
        <CardContent>
          <Box sx={{ display:'grid', gap: 2, gridTemplateColumns: { xs:'1fr', md:'repeat(2, 1fr)' } }}>
            <TextField label="Default Currency" value={draft.defaultCurrency} onChange={e => onChange('defaultCurrency', e.target.value.toUpperCase())} size="small" helperText="ISO 4217, e.g. USD, EUR" />
            <TextField label="Time Zone" value={draft.timeZone} onChange={e => onChange('timeZone', e.target.value)} size="small" helperText="e.g. UTC, America/Los_Angeles" />
            <TextField label="Locale" value={draft.locale} onChange={e => onChange('locale', e.target.value)} size="small" helperText="e.g. en-US, fr-FR" />
            <TextField label="Date Format" value={draft.dateFormat} onChange={e => onChange('dateFormat', e.target.value)} size="small" helperText="Display format, e.g. YYYY-MM-DD" />
            <TextField label="Primary Color" type="color" value={draft.primaryColor} onChange={e => onChange('primaryColor', e.target.value)} size="small" />
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title={<Typography variant="h6">Policies & Features</Typography>} subheader="Enable controls and security" />
        <Divider/>
        <CardContent>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
            <FormControlLabel control={<Switch checked={draft.enableApprovals} onChange={e => onChange('enableApprovals', e.target.checked)} />} label="Enable Approvals" />
            <FormControlLabel control={<Switch checked={draft.enforce2FA} onChange={e => onChange('enforce2FA', e.target.checked)} />} label="Enforce 2FA" />
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" variant="outlined">{error}</Alert>}
      <Box display="flex" gap={2} alignItems="center">
        <Button variant="contained" disabled={!dirty || saving} onClick={save} sx={{ textTransform:'none' }}>{saving ? 'Saving…' : 'Save Configurations'}</Button>
        {msg && <Typography variant="body2" color="success.main">{msg}</Typography>}
      </Box>
    </Stack>
  );
}
