"use client";
import React from 'react';
import { useTenants } from './TenantContext';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Box } from '@mui/material';

interface TenantSelectorProps {
  fullWidth?: boolean;
  autoFocus?: boolean;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({ fullWidth, autoFocus }) => {
  const { tenants, activeTenantId, setActiveTenantId, loading } = useTenants();

  if (loading) return <Box display="flex" alignItems="center" gap={1}><CircularProgress size={20} /> Loading tenants...</Box>;
  if (!tenants.length) return <div>No tenants</div>;

  return (
    <FormControl size="small" fullWidth={fullWidth}>
      <InputLabel id="tenant-select-label">Tenant</InputLabel>
      <Select
        labelId="tenant-select-label"
        value={activeTenantId || ''}
        label="Tenant"
        autoFocus={autoFocus}
        onChange={(e) => setActiveTenantId(e.target.value as string)}
      >
        {tenants.map(t => (
          <MenuItem key={t.tenant_id} value={t.tenant_id}>{t.tenant_name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
