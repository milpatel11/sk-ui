"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, Tabs, Tab, Typography, Paper, Divider, CircularProgress, Stack, Chip } from '@mui/material';
import { apiClient } from '@/lib/apiClient';

// Finance Suite Tabs: POS (basic KPIs), Invoices, Statements, Accounts (AR/AP)
const VALID_TABS = ['pos','invoices','statements','accounts'] as const;
type FinanceTab = typeof VALID_TABS[number];

export default function FinanceTabPage(){
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;
  const routeTab = params?.tab as string | undefined; // dynamic [tab] param
  const initialTab: FinanceTab = (routeTab && (VALID_TABS as readonly string[]).includes(routeTab)) ? routeTab as FinanceTab : 'pos';
  const [tab, setTab] = useState<FinanceTab>(initialTab);

  // POS module lightweight metrics (reusing existing mock POS endpoints)
  const [loading, setLoading] = useState(false);
  const [posProducts, setPosProducts] = useState<any[]>([]);
  const [posCustomers, setPosCustomers] = useState<any[]>([]);
  const [posSales, setPosSales] = useState<any[]>([]);
  const [error, setError] = useState<string|null>(null);

  const loadPos = useCallback(async ()=>{
    if(tab !== 'pos') return; // only load when viewing POS tab
    setLoading(true); setError(null);
    try {
      const [prodR, custR, saleR] = await Promise.all([
        apiClient.get('/pos/products'),
        apiClient.get('/pos/customers'),
        apiClient.get('/pos/sales')
      ]);
      setPosProducts(Array.isArray(prodR.data)? prodR.data:[]);
      setPosCustomers(Array.isArray(custR.data)? custR.data:[]);
      setPosSales(Array.isArray(saleR.data)? saleR.data:[]);
    } catch(e){ setError(e instanceof Error ? e.message : 'Failed to load POS metrics'); }
    finally { setLoading(false); }
  },[tab]);

  useEffect(()=>{ void loadPos(); },[loadPos]);

  useEffect(()=>{
    if (!tenantId) return;
    if(!routeTab || !(VALID_TABS as readonly string[]).includes(routeTab)){
      router.replace(`/tenant/${tenantId}/finance/pos`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tenantId, routeTab]);

  const changeTab = (_:React.SyntheticEvent, value:string) => {
    if(value===tab) return;
    if((VALID_TABS as readonly string[]).includes(value)){
      setTab(value as FinanceTab);
      if (tenantId) router.replace(`/tenant/${tenantId}/finance/${value}`);
    }
  };

  const heading = useMemo(()=>{
    switch(tab){
      case 'pos': return 'Financial Ops: POS Overview';
      case 'invoices': return 'Invoice Management';
      case 'statements': return 'Statements Management';
      case 'accounts': return 'Accounts (AR / AP)';
      default: return 'Financial Operations';
    }
  },[tab]);

  // POS derived metrics
  const activeProducts = posProducts.filter(p=>p.active!==false).length;
  const totalCustomers = posCustomers.length;
  const totalSales = posSales.length;
  const grossCents = posSales.reduce((a,s)=> a + (s.totalCents||0),0);
  const formatMoney = (cents?: number) => typeof cents === 'number' ? (cents/100).toLocaleString(undefined,{style:'currency',currency:'USD'}) : '';

  return (
    <Box maxWidth={1400} mx="auto" px={{ xs:1, sm:2, md:3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>{heading}</Typography>
      <Paper elevation={0} variant="outlined" sx={{ p:1.5, borderRadius:2 }}>
        <Tabs value={tab} onChange={changeTab} variant="scrollable" allowScrollButtonsMobile sx={{ '& .MuiTab-root': { textTransform:'none', fontWeight:500, minHeight:44 }, '& .MuiTabs-indicator': { height:3 } }}>
          <Tab label="POS" value="pos" />
          <Tab label="Invoices" value="invoices" />
            <Tab label="Statements" value="statements" />
          <Tab label="Accounts (AR/AP)" value="accounts" />
        </Tabs>
        <Divider sx={{ mb:2 }} />
        {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}
        {tab==='pos' && (
          <Box>
            {loading && <Box display="flex" alignItems="center" gap={1} mb={2}><CircularProgress size={20} /><Typography variant="caption" color="text.secondary">Loading metrics…</Typography></Box>}
            <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
              <Paper variant="outlined" sx={{ p:1.5, minWidth:160 }}><Typography variant="caption" color="text.secondary">Active Products</Typography><Typography variant="h6">{activeProducts}</Typography></Paper>
              <Paper variant="outlined" sx={{ p:1.5, minWidth:160 }}><Typography variant="caption" color="text.secondary">Customers</Typography><Typography variant="h6">{totalCustomers}</Typography></Paper>
              <Paper variant="outlined" sx={{ p:1.5, minWidth:160 }}><Typography variant="caption" color="text.secondary">Sales</Typography><Typography variant="h6">{totalSales}</Typography></Paper>
              <Paper variant="outlined" sx={{ p:1.5, minWidth:160 }}><Typography variant="caption" color="text.secondary">Gross</Typography><Typography variant="h6">{formatMoney(grossCents)}</Typography></Paper>
            </Stack>
            <Paper variant="outlined" sx={{ p:2 }}>
              <Typography variant="subtitle2" gutterBottom>Recent Sales</Typography>
              <Stack spacing={1}>
                {posSales.slice(0,6).map(s => (
                  <Box key={s.id} display="flex" alignItems="center" gap={1}>
                    <Chip size="small" label={(s.items||[]).length + ' lines'} />
                    <Typography variant="body2" flexGrow={1}>{new Date(s.createdAt).toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatMoney(s.totalCents)}</Typography>
                  </Box>
                ))}
                {posSales.length===0 && !loading && <Typography variant="caption" color="text.secondary">No sales yet</Typography>}
              </Stack>
            </Paper>
            <Typography variant="caption" color="text.secondary" display="block" mt={2}>POS module is read-only snapshot here. Full CRUD legacy view pending migration.</Typography>
          </Box>
        )}
        {tab==='invoices' && (
          <Box>
            <Typography variant="body2" mb={2}>Invoice management workspace placeholder.</Typography>
            <Paper variant="outlined" sx={{ p:2 }}>
              <Typography variant="subtitle2">Planned Features</Typography>
              <ul style={{ marginTop:8, paddingLeft:20 }}>
                <li>Create & send invoices</li>
                <li>Draft / Sent / Paid / Overdue lifecycle</li>
                <li>Bulk PDF export & email dispatch</li>
                <li>Payment reconciliation hooks</li>
              </ul>
            </Paper>
          </Box>
        )}
        {tab==='statements' && (
          <Box>
            <Typography variant="body2" mb={2}>Statements management placeholder (customer & vendor monthly statements).</Typography>
            <Paper variant="outlined" sx={{ p:2 }}>
              <Typography variant="subtitle2">Planned Features</Typography>
              <ul style={{ marginTop:8, paddingLeft:20 }}>
                <li>Generate account statements per period</li>
                <li>Dispute / adjustment workflow</li>
                <li>Aging summaries</li>
              </ul>
            </Paper>
          </Box>
        )}
        {tab==='accounts' && (
          <Box>
            <Typography variant="body2" mb={2}>Accounts Receivable / Accounts Payable cockpit placeholder.</Typography>
            <Paper variant="outlined" sx={{ p:2, mb:2 }}>
              <Typography variant="subtitle2">Planned Features</Typography>
              <ul style={{ marginTop:8, paddingLeft:20 }}>
                <li>AR aging buckets & DSO metrics</li>
                <li>AP upcoming obligations & cash forecasting</li>
                <li>Partial / split payments tracking</li>
                <li>Dispute resolution workflow</li>
              </ul>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
}