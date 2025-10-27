"use client";
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import { Box, Typography, Paper, Tabs, Tab, Stack, Divider, Button, TextField, Chip, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Tooltip, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

const APPS = ['Finance','Human Resources','Inventory','ITDN','Task Management','User Management','Admin','Market','CRM'] as const;
type AppTab = typeof APPS[number];

export default function ReportingPage() {
  const params = useParams();
  const tenantId = params?.tenantId as string | undefined;
  const [app, setApp] = useState<AppTab>('Finance');
  const [from, setFrom] = useState<string>(() => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0,10));
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Market inner tabs
  type MarketTab = 'events' | 'trends' | 'news';
  const [marketTab, setMarketTab] = useState<MarketTab>('events');

  // Finance data
  type FinanceTxn = { id: string; date: string; currency: string; reference?: string; memo?: string; lines: { accountId: string; description?: string; debitCents?: number; creditCents?: number }[] };
  type FinanceAccount = { id: string; code?: string; name: string; currency: string };
  const [finTxns, setFinTxns] = useState<FinanceTxn[]>([]);
  const [finAccounts, setFinAccounts] = useState<FinanceAccount[]>([]);

  const loadFinance = useCallback(async () => {
    if (app !== 'Finance') return;
    setLoading(true); setError(null);
    try {
      const q = new URLSearchParams();
      if (tenantId) q.set('tenantId', tenantId);
      const [acctRes, txnRes] = await Promise.all([
        apiClient.get(`/finance/accounts?${q.toString()}`),
        apiClient.get(`/finance/transactions?${q.toString()}`)
      ]);
      const txns = (Array.isArray(txnRes.data) ? txnRes.data : []) as FinanceTxn[];
      const inRange = txns.filter(t => {
        const d = (t.date||'').slice(0,10);
        return (!from || d >= from) && (!to || d <= to);
      });
      setFinTxns(inRange);
      setFinAccounts(Array.isArray(acctRes.data) ? (acctRes.data as FinanceAccount[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load finance data');
    } finally { setLoading(false); }
  }, [app, tenantId, from, to]);

  useEffect(() => { void loadFinance(); }, [loadFinance]);

  const finKpis = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of finTxns) {
      for (const l of (t.lines||[])) { income += (l.creditCents||0); expense += (l.debitCents||0); }
    }
    return { income, expense, net: income - expense };
  }, [finTxns]);

  const finTopExpenses = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of finTxns) for (const l of (t.lines||[])) map.set(l.accountId, (map.get(l.accountId)||0) + (l.debitCents||0));
    const rows = Array.from(map.entries()).map(([accountId, cents]) => ({ accountId, cents })).sort((a,b)=>b.cents-a.cents).slice(0,5);
    return rows.map(r => ({
      account: finAccounts.find(a => a.id === r.accountId) || { id: r.accountId, name: 'Unknown', currency: 'USD' },
      cents: r.cents
    }));
  }, [finTxns, finAccounts]);

  const formatMoney = (currency: string, cents: number) => {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency}).format((cents||0)/100); } catch { return ((cents||0)/100).toFixed(2); }
  };

  const onExport = (fmt: 'csv'|'json') => {
    if (app !== 'Finance') return; // extend for other apps later
    const rows: any[] = finTxns.map(t => ({ id: t.id, date: (t.date||'').slice(0,10), reference: t.reference||'', memo: t.memo||'', lines: t.lines?.length||0 }));
    if (fmt === 'json') {
      download(`finance-report-${from}-to-${to}.json`, JSON.stringify({ kpis: finKpis, transactions: rows }, null, 2));
    } else {
      const header = ['id','date','reference','memo','lines'];
      const csv = [header.join(',')].concat(rows.map(r => [esc(r.id),esc(r.date),esc(r.reference),esc(r.memo),String(r.lines)].join(','))).join('\r\n');
      download(`finance-report-${from}-to-${to}.csv`, csv);
    }
  };

  return (
    <Box p={2} maxWidth={1400} mx="auto">
      <Stack direction={{xs:'column', sm:'row'}} alignItems={{xs:'flex-start', sm:'center'}} spacing={1.5} mb={1.5}>
        <Typography variant="h6" fontWeight={700} flexGrow={1}>Reporting</Typography>
        <TextField size="small" label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} InputLabelProps={{shrink:true}} />
        <TextField size="small" label="To" type="date" value={to} onChange={e => setTo(e.target.value)} InputLabelProps={{shrink:true}} />
        <Tooltip title="Export JSON"><span><IconButton onClick={() => onExport('json')}><DownloadIcon/></IconButton></span></Tooltip>
        <Tooltip title="Export CSV"><span><IconButton onClick={() => onExport('csv')}><DownloadIcon/></IconButton></span></Tooltip>
        <Tooltip title="Print"><span><IconButton onClick={() => window.print()}><PrintIcon/></IconButton></span></Tooltip>
      </Stack>
      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
        <Tabs value={app} onChange={(_, v) => setApp(v)} variant="scrollable" allowScrollButtonsMobile sx={{'& .MuiTab-root': { textTransform:'none', minHeight: 44 }, '& .MuiTabs-indicator': { height: 3 }}}>
          {APPS.map(a => (<Tab key={a} label={a} value={a} />))}
        </Tabs>
        <Divider sx={{mb:2}}/>
        {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}
        {app === 'Finance' && (
          <Box>
            {loading && <Box display="flex" alignItems="center" gap={1} mb={2}><CircularProgress size={18}/><Typography variant="caption" color="text.secondary">Loading…</Typography></Box>}
            <Stack direction="row" spacing={2} sx={{flexWrap:'wrap'}} mb={2}>
              <Paper variant="outlined" sx={{p:1.5, minWidth:200}}>
                <Typography variant="caption" color="text.secondary">Total Income</Typography>
                <Typography variant="h6">{formatMoney('USD', finKpis.income)}</Typography>
              </Paper>
              <Paper variant="outlined" sx={{p:1.5, minWidth:200}}>
                <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
                <Typography variant="h6">{formatMoney('USD', finKpis.expense)}</Typography>
              </Paper>
              <Paper variant="outlined" sx={{p:1.5, minWidth:200}}>
                <Typography variant="caption" color="text.secondary">Net</Typography>
                <Typography variant="h6">{formatMoney('USD', finKpis.net)}</Typography>
              </Paper>
            </Stack>
            <Paper variant="outlined" sx={{p:1}}>
              <Typography variant="subtitle2" gutterBottom>Top Expenses</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell sx={{width:160}}>Code</TableCell>
                    <TableCell align="right" sx={{width:180}}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finTopExpenses.length === 0 && (
                    <TableRow><TableCell colSpan={3}><Typography variant="caption" color="text.secondary">No data in range</Typography></TableCell></TableRow>
                  )}
                  {finTopExpenses.map(row => (
                    <TableRow key={row.account.id}>
                      <TableCell><Typography variant="body2">{row.account.name}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{fontFamily:'monospace'}}>{row.account.code || '—'}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{formatMoney('USD', row.cents)}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>Note: credits treated as income, debits as expenses for this summary.</Typography>
            </Paper>
          </Box>
        )}
        {app === 'Human Resources' && (
          <Box>
            <Typography variant="body2" mb={1}>Headcount and hiring pipeline (demo data)</Typography>
            <Stack direction="row" spacing={2} sx={{flexWrap:'wrap'}}>
              <Kpi label="Headcount" value={128} />
              <Kpi label="Open Roles" value={9} />
              <Kpi label="Offers This Month" value={3} />
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>Connect to ATS/HRIS for live data.</Typography>
          </Box>
        )}
        {app === 'Inventory' && (
          <Box>
            <Typography variant="body2" mb={1}>Inventory health (demo data)</Typography>
            <Stack direction="row" spacing={2} sx={{flexWrap:'wrap'}}>
              <Kpi label="SKUs" value={542} />
              <Kpi label="Low Stock" value={17} />
              <Kpi label="Out of Stock" value={4} />
            </Stack>
          </Box>
        )}
        {app === 'ITDN' && (
          <Box>
            <Typography variant="body2" mb={1}>Transport & delivery KPIs (demo data)</Typography>
            <Stack direction="row" spacing={2} sx={{flexWrap:'wrap'}}>
              <Kpi label="Shuttle Trips" value={218} />
              <Kpi label="On-time %" value={"97%"} />
              <Kpi label="Deliveries" value={864} />
            </Stack>
          </Box>
        )}
        {app === 'Task Management' && (
          <Box>
            <Typography variant="body2" mb={1}>Work management KPIs (demo data)</Typography>
            <Stack direction="row" spacing={2} sx={{flexWrap:'wrap'}}>
              <Kpi label="New Tasks" value={342} />
              <Kpi label="Resolved" value={318} />
              <Kpi label="SLA Breaches" value={7} />
            </Stack>
          </Box>
        )}
        {app === 'User Management' && (
          <Box>
            <Typography variant="body2" mb={1}>User directory analytics (demo data)</Typography>
            <Stack direction="row" spacing={2} sx={{flexWrap:'wrap'}}>
              <Kpi label="Active Users" value={1024} />
              <Kpi label="Invitations Pending" value={23} />
              <Kpi label="2FA Enrolled" value={"81%"} />
            </Stack>
          </Box>
        )}
        {app === 'Admin' && (
          <Box>
            <Typography variant="body2" mb={1}>Administration insights (demo data)</Typography>
            <Stack direction="row" spacing={2} sx={{flexWrap:'wrap'}}>
              <Kpi label="Policy Changes" value={5} />
              <Kpi label="Audit Events" value={412} />
            </Stack>
          </Box>
        )}
        {app === 'Market' && (
          <Box>
            <Stack direction={{xs:'column', sm:'row'}} alignItems={{xs:'flex-start', sm:'center'}} spacing={1.5} mb={1.5}>
              <Typography variant="subtitle1" fontWeight={600} flexGrow={1}>Market Intelligence</Typography>
              {/* Inner tabs for Market */}
            </Stack>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Tabs
                value={marketTab}
                onChange={(_, v) => setMarketTab(v)}
                sx={{ '& .MuiTab-root': { textTransform:'none', minHeight: 40 } }}
              >
                <Tab value="events" label="Events" />
                <Tab value="trends" label="Hashtags & Trends" />
                <Tab value="news" label="News" />
              </Tabs>
              <Divider sx={{ mb: 2 }} />
              {marketTab === 'events' && (
                <Box>
                  <Typography variant="body2" mb={1}>Upcoming and past market events (placeholder).</Typography>
                  <Stack direction="row" spacing={2} sx={{flexWrap:'wrap'}}>
                    <Kpi label="Conferences" value={3} />
                    <Kpi label="Webinars" value={5} />
                    <Kpi label="Product Launches" value={2} />
                  </Stack>
                </Box>
              )}
              {marketTab === 'trends' && (
                <Box>
                  <Typography variant="body2" mb={1}>Top hashtags and social media trends (placeholder).</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Hashtag</TableCell>
                        <TableCell sx={{width:160}}>Platform</TableCell>
                        <TableCell align="right" sx={{width:140}}>Mentions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell><Typography variant="body2">#AI</Typography></TableCell>
                        <TableCell><Typography variant="body2">Twitter/X</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2">12,345</Typography></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Typography variant="body2">#Sustainability</Typography></TableCell>
                        <TableCell><Typography variant="body2">LinkedIn</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2">8,902</Typography></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>Connect social APIs later for live data.</Typography>
                </Box>
              )}
              {marketTab === 'news' && (
                <Box>
                  <Typography variant="body2" mb={1}>Recent market news (placeholder).</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Headline</TableCell>
                        <TableCell sx={{width:180}}>Source</TableCell>
                        <TableCell sx={{width:160}}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell><Typography variant="body2">Industry index hits new high</Typography></TableCell>
                        <TableCell><Typography variant="body2">MarketWatch</Typography></TableCell>
                        <TableCell><Typography variant="body2">{new Date().toISOString().slice(0,10)}</Typography></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Typography variant="body2">Emerging tech conference announces speakers</Typography></TableCell>
                        <TableCell><Typography variant="body2">TechCrunch</Typography></TableCell>
                        <TableCell><Typography variant="body2">{new Date().toISOString().slice(0,10)}</Typography></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Paper>
          </Box>
        )}
        {app === 'CRM' && (
          <Box>
            <Typography variant="body2" mb={1}>Customer Relationship Management (demo data)</Typography>
            <Stack direction="row" spacing={2} sx={{flexWrap:'wrap'}}>
              <Kpi label="Leads" value={128} />
              <Kpi label="Opportunities" value={42} />
              <Kpi label="Pipeline $" value={"$1.2M"} />
              <Kpi label="Closed Won (30d)" value={7} />
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>Hook up CRM source later (e.g., Salesforce, HubSpot) for live metrics.</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{p:1.5, minWidth: 180}}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6">{value}</Typography>
    </Paper>
  );
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function esc(v: string) {
  if (v == null) return '';
  if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}
