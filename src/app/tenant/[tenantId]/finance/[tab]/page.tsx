"use client";
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {
    Box,
    Chip,
    CircularProgress,
    Divider,
    Paper,
    Stack,
    Tab,
    Tabs,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    MenuItem,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {apiClient} from '@/lib/apiClient';

// Finance Suite Tabs: Journal, Import/Export, Projections, Assets/Liabilities, Vendors, Rules
const VALID_TABS = ['journal', 'import', 'export', 'projections', 'assets', 'liabilities', 'vendors', 'rules'] as const;
type FinanceTab = typeof VALID_TABS[number];

type FinanceAccount = {
    id: string;
    tenantId?: string | null;
    type: 'ASSET' | 'LIABILITY';
    name: string;
    code?: string;
    description?: string;
    currency: string;
    balanceCents: number;
};

type FinanceTxn = {
    id: string;
    tenantId?: string | null;
    date: string;
    currency: string;
    reference?: string;
    memo?: string;
    status?: 'POSTED' | 'DRAFT' | 'VOID';
    lines: { accountId: string; description?: string; debitCents?: number; creditCents?: number }[];
};

type FinanceVendor = {
    id: string;
    tenantId?: string | null;
    name: string;
    category?: string | null;
    defaultAccountId?: string | null;
    notes?: string | null;
};

type FinanceRule = {
    id: string;
    tenantId?: string | null;
    pattern: string; // substring or regex source
    field: 'memo' | 'reference' | 'merchant' | 'lineItem';
    accountId: string; // target ledger account
    priority?: number;
    active?: boolean;
};

export default function FinanceTabPage() {
    const router = useRouter();
    const params = useParams();
    const tenantId = params?.tenantId as string | undefined;
    const routeTab = params?.tab as string | undefined; // dynamic [tab] param
    const initialTab: FinanceTab = (routeTab && (VALID_TABS as readonly string[]).includes(routeTab)) ? routeTab as FinanceTab : 'journal';
    const [tab, setTab] = useState<FinanceTab>(initialTab);

    // Shared loading/error
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tenantId) return;
        if (!routeTab || !(VALID_TABS as readonly string[]).includes(routeTab)) {
            router.replace(`/tenant/${tenantId}/finance/journal`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantId, routeTab]);

    const changeTab = (_: React.SyntheticEvent, value: string) => {
        if (value === tab) return;
        if ((VALID_TABS as readonly string[]).includes(value)) {
            setTab(value as FinanceTab);
            if (tenantId) router.replace(`/tenant/${tenantId}/finance/${value}`);
        }
    };

    const heading = useMemo(() => {
        switch (tab) {
            case 'journal':
                return 'Journal Entries';
            case 'import':
                return 'Data Import';
            case 'export':
                return 'Data Export';
            case 'projections':
                return 'Projections';
            case 'assets':
                return 'Assets Register';
            case 'liabilities':
                return 'Liabilities Register';
            default:
                return 'Financial Operations';
        }
    }, [tab]);

    // Assets & Liabilities state
    const [finAccounts, setFinAccounts] = useState<FinanceAccount[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<FinanceAccount | null>(null);
    const [fName, setFName] = useState('');
    const [fCode, setFCode] = useState('');
    const [fCurrency, setFCurrency] = useState('USD');
    const [fBalance, setFBalance] = useState(''); // human-readable amount
    const [fDesc, setFDesc] = useState('');

    // no-op here: transactions state declared further below with related handlers

    const openCreate = () => {
        setEditing(null);
        setFName('');
        setFCode('');
        setFCurrency('USD');
        setFBalance('');
        setFDesc('');
        setModalOpen(true);
    };
    const openEdit = (acc: FinanceAccount) => {
        setEditing(acc);
        setFName(acc.name || '');
        setFCode(acc.code || '');
        setFCurrency(acc.currency || 'USD');
        setFBalance(fromCents(acc.balanceCents || 0));
        setFDesc(acc.description || '');
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
    };

    // Loader for Assets/Liabilities
    const loadFinAccounts = useCallback(async () => {
        if (tab !== 'assets' && tab !== 'liabilities') return;
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (tenantId) q.set('tenantId', tenantId);
            q.set('type', tab === 'assets' ? 'ASSET' : 'LIABILITY');
            const res = await apiClient.get(`/finance/accounts?${q.toString()}`);
            setFinAccounts(Array.isArray(res.data) ? (res.data as FinanceAccount[]) : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load accounts');
        } finally {
            setLoading(false);
        }
    }, [tab, tenantId]);

    useEffect(() => { void loadFinAccounts(); }, [loadFinAccounts]);

    // Create account
    const saveAccount = async () => {
        if (!fName.trim()) { setError('Name is required'); return; }
        if (!isCurrencyValid) { setError('Currency must be a 3-letter code'); return; }
        try {
            setLoading(true);
            setError(null);
            const payload: any = {
                tenantId,
                type: tab === 'assets' ? 'ASSET' : 'LIABILITY',
                name: fName.trim(),
                code: fCode.trim() || undefined,
                currency: fCurrency.trim().toUpperCase(),
                balanceCents: toCents(fBalance),
                description: fDesc.trim() || undefined,
            };
            await apiClient.post('/finance/accounts', payload);
            setModalOpen(false);
            await loadFinAccounts();
        } catch (e: any) {
            setError(e?.message || 'Failed to save account');
        } finally {
            setLoading(false);
        }
    };

    // Delete account
    const deleteAccount = async (acc: FinanceAccount) => {
        const ok = window.confirm(`Delete account ${acc.code ? acc.code + ' ' : ''}${acc.name}?`);
        if (!ok) return;
        try {
            setLoading(true);
            setError(null);
            await apiClient.delete(`/finance/accounts/${acc.id}`);
            await loadFinAccounts();
        } catch (e: any) {
            setError(e?.message || 'Failed to delete account');
        } finally {
            setLoading(false);
        }
    };

    // Transactions state
    const [txns, setTxns] = useState<FinanceTxn[]>([]);
    const [accountsAll, setAccountsAll] = useState<FinanceAccount[]>([]);
    const [txnModalOpen, setTxnModalOpen] = useState(false);
    const [editingTxn, setEditingTxn] = useState<FinanceTxn | null>(null);
    const [tDate, setTDate] = useState<string>(() => new Date().toISOString().slice(0,10));
    const [tCurrency, setTCurrency] = useState('USD');
    const [tReference, setTReference] = useState('');
    const [tMemo, setTMemo] = useState('');
    const [tLines, setTLines] = useState<{ accountId: string; description?: string; debit: string; credit: string }[]>(
        [{ accountId: '', description: '', debit: '', credit: '' },
        { accountId: '', description: '', debit: '', credit: '' },
    ]);

    const isCurrencyValid = useMemo(() => /^[A-Z]{3}$/.test((fCurrency || '').trim()), [fCurrency]);
    const isTxnCurrencyValid = useMemo(() => /^[A-Z]{3}$/.test((tCurrency || '').trim()), [tCurrency]);

    // Import state
    const [importText, setImportText] = useState<string>('');
    const [importFileName, setImportFileName] = useState<string>('');
    const [importPreview, setImportPreview] = useState<string[]>([]);

    // Load transactions and accounts when relevant tabs need them
    const loadTransactions = useCallback(async () => {
        if (!(tab === 'journal' || tab === 'export' || tab === 'import' || tab === 'projections')) return;
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (tenantId) q.set('tenantId', tenantId);
            const [acctRes, txnRes] = await Promise.all([
                apiClient.get(`/finance/accounts?${q.toString()}`),
                apiClient.get(`/finance/transactions?${q.toString()}`)
            ]);
            setAccountsAll(Array.isArray(acctRes.data) ? (acctRes.data as FinanceAccount[]) : []);
            setTxns(Array.isArray(txnRes.data) ? (txnRes.data as FinanceTxn[]) : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    }, [tab, tenantId]);

    useEffect(() => { void loadTransactions(); }, [loadTransactions]);

    const openCreateTxn = () => {
        setEditingTxn(null);
        setTDate(new Date().toISOString().slice(0,10));
        setTCurrency('USD');
        setTReference('');
        setTMemo('');
        setTLines([{ accountId: '', description: '', debit: '', credit: '' }, { accountId: '', description: '', debit: '', credit: '' }]);
        setTxnModalOpen(true);
    };
    const openEditTxn = (t: FinanceTxn) => {
        setEditingTxn(t);
        setTDate((t.date || '').slice(0,10));
        setTCurrency(t.currency || 'USD');
        setTReference(t.reference || '');
        setTMemo(t.memo || '');
        setTLines((t.lines || []).map(l => ({ accountId: l.accountId, description: l.description || '', debit: l.debitCents ? fromCents(l.debitCents) : '', credit: l.creditCents ? fromCents(l.creditCents) : '' })));
        if ((t.lines || []).length < 2) setTLines(prev => prev.concat({ accountId: '', description: '', debit: '', credit: '' }));
        setTxnModalOpen(true);
    };
    const closeTxnModal = () => setTxnModalOpen(false);

    const addTxnLine = () => setTLines(lines => [...lines, { accountId: '', description: '', debit: '', credit: '' }]);
    const removeTxnLine = (idx: number) => setTLines(lines => lines.length > 1 ? lines.filter((_, i) => i !== idx) : lines);

    const setTxnLineField = (idx: number, field: 'accountId'|'description'|'debit'|'credit', value: string) => {
        setTLines(lines => lines.map((ln, i) => i === idx ? { ...ln, [field]: field === 'debit' ? value.replace(/[^\d.]/g, '').replace(/(\..*?)\..*/,'$1') : field === 'credit' ? value.replace(/[^\d.]/g, '').replace(/(\..*?)\..*/,'$1') : value } : ln));
    };

    const txnTotals = useMemo(() => {
        let d = 0, c = 0;
        for (const ln of tLines) {
            d += toCents(ln.debit || '');
            c += toCents(ln.credit || '');
        }
        return { debit: d, credit: c, balanced: d === c && d > 0 };
    }, [tLines]);

    const saveTxn = async () => {
        if (!isTxnCurrencyValid) { setError('Currency must be a 3-letter code'); return; }
        if (!tDate) { setError('Date is required'); return; }
        if (tLines.length < 2) { setError('Need at least 2 lines'); return; }
        if (!txnTotals.balanced) { setError('Entry must be balanced and non-zero'); return; }
        const lines = tLines.map(l => ({ accountId: l.accountId, description: l.description || '', debitCents: toCents(l.debit), creditCents: toCents(l.credit) }));
        // Validate each line: account and either debit or credit
        for (const ln of lines) {
            if (!ln.accountId) { setError('Line has no account'); return; }
            const hasD = (ln.debitCents || 0) > 0; const hasC = (ln.creditCents || 0) > 0;
            if ((hasD && hasC) || (!hasD && !hasC)) { setError('Each line needs either debit or credit, not both'); return; }
        }
        try {
            setLoading(true);
            setError(null);
            const payload: any = {
                tenantId,
                date: tDate,
                currency: tCurrency.trim(),
                reference: tReference.trim() || undefined,
                memo: tMemo.trim() || undefined,
                lines,
            };
            if (editingTxn) await apiClient.put(`/finance/transactions/${editingTxn.id}`, payload);
            else await apiClient.post('/finance/transactions', payload);
            setTxnModalOpen(false);
            await loadTransactions();
        } catch (e: any) {
            setError(e?.message || 'Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    const deleteTxn = async () => {
        if (!editingTxn) return;
        try {
            setLoading(true);
            setError(null);
            await apiClient.delete(`/finance/transactions/${editingTxn.id}`);
            setTxnModalOpen(false);
            await loadTransactions();
        } catch (e: any) {
            setError(e?.message || 'Failed to delete transaction');
        } finally {
            setLoading(false);
        }
    };

    const totalsByCurrency = useMemo(() => {
        const m = new Map<string, number>();
        finAccounts.forEach(a => {
            const cur = a.currency || 'USD';
            m.set(cur, (m.get(cur) || 0) + (a.balanceCents || 0));
        });
        return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [finAccounts]);

    // Vendors state
    const [vendors, setVendors] = useState<FinanceVendor[]>([]);
    const [vModalOpen, setVModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<FinanceVendor | null>(null);
    const [vName, setVName] = useState('');
    const [vCategory, setVCategory] = useState('');
    const [vDefaultAccountId, setVDefaultAccountId] = useState('');
    const [vNotes, setVNotes] = useState('');

    const loadVendors = useCallback(async () => {
        if (tab !== 'vendors') return;
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (tenantId) q.set('tenantId', tenantId);
            const res = await apiClient.get(`/finance/vendors?${q.toString()}`);
            setVendors(Array.isArray(res.data) ? (res.data as FinanceVendor[]) : []);
            // Also ensure accounts are available for default account selection
            const acctRes = await apiClient.get(`/finance/accounts?${q.toString()}`);
            setAccountsAll(Array.isArray(acctRes.data) ? (acctRes.data as FinanceAccount[]) : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load vendors');
        } finally {
            setLoading(false);
        }
    }, [tab, tenantId]);

    useEffect(() => { void loadVendors(); }, [loadVendors]);

    const openCreateVendor = () => {
        setEditingVendor(null);
        setVName('');
        setVCategory('');
        setVDefaultAccountId('');
        setVNotes('');
        setVModalOpen(true);
    };
    const openEditVendor = (v: FinanceVendor) => {
        setEditingVendor(v);
        setVName(v.name || '');
        setVCategory(v.category || '');
        setVDefaultAccountId(v.defaultAccountId || '');
        setVNotes(v.notes || '');
        setVModalOpen(true);
    };
    const closeVendorModal = () => setVModalOpen(false);

    const saveVendor = async () => {
        if (!vName.trim()) { setError('Name is required'); return; }
        try {
            setLoading(true);
            setError(null);
            const payload: any = {
                tenantId,
                name: vName.trim(),
                category: vCategory.trim() || undefined,
                defaultAccountId: vDefaultAccountId || undefined,
                notes: vNotes.trim() || undefined,
            };
            if (editingVendor) await apiClient.put(`/finance/vendors/${editingVendor.id}`, payload);
            else await apiClient.post('/finance/vendors', payload);
            setVModalOpen(false);
            await loadVendors();
        } catch (e: any) {
            setError(e?.message || 'Failed to save vendor');
        } finally { setLoading(false); }
    };
    const deleteVendor = async (v: FinanceVendor) => {
        const ok = window.confirm(`Delete vendor ${v.name}?`);
        if (!ok) return;
        try {
            setLoading(true);
            setError(null);
            await apiClient.delete(`/finance/vendors/${v.id}`);
            await loadVendors();
        } catch (e: any) {
            setError(e?.message || 'Failed to delete vendor');
        } finally { setLoading(false); }
    };

    // Rules state
    const [rules, setRules] = useState<FinanceRule[]>([]);
    const [rModalOpen, setRModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<FinanceRule | null>(null);
    const [rPattern, setRPattern] = useState('');
    const [rField, setRField] = useState<'memo' | 'reference' | 'merchant' | 'lineItem'>('memo');
    const [rAccountId, setRAccountId] = useState('');
    const [rPriority, setRPriority] = useState<number>(100);
    const [rActive, setRActive] = useState<boolean>(true);
    
    // Projections state (period granularity)
    type Period = 'monthly' | 'quarterly' | 'annually';
    const [projPeriod, setProjPeriod] = useState<Period>('monthly');

    const loadRules = useCallback(async () => {
        if (tab !== 'rules') return;
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (tenantId) q.set('tenantId', tenantId);
            const [ruleRes, acctRes] = await Promise.all([
                apiClient.get(`/finance/rules?${q.toString()}`),
                apiClient.get(`/finance/accounts?${q.toString()}`)
            ]);
            setRules(Array.isArray(ruleRes.data) ? (ruleRes.data as FinanceRule[]) : []);
            setAccountsAll(Array.isArray(acctRes.data) ? (acctRes.data as FinanceAccount[]) : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load rules');
        } finally { setLoading(false); }
    }, [tab, tenantId]);

    useEffect(() => { void loadRules(); }, [loadRules]);

    const openCreateRule = () => {
        setEditingRule(null);
        setRPattern('');
        setRField('memo');
        setRAccountId('');
        setRPriority(100);
        setRActive(true);
        setRModalOpen(true);
    };
    const openEditRule = (r: FinanceRule) => {
        setEditingRule(r);
        setRPattern(r.pattern || '');
        setRField(r.field || 'memo');
        setRAccountId(r.accountId || '');
        setRPriority(typeof r.priority === 'number' ? r.priority : 100);
        setRActive(r.active !== false);
        setRModalOpen(true);
    };
    const closeRuleModal = () => setRModalOpen(false);

    const saveRule = async () => {
        if (!rPattern.trim()) { setError('Pattern is required'); return; }
        if (!rAccountId) { setError('Target account is required'); return; }
        try {
            setLoading(true);
            setError(null);
            const payload: any = {
                tenantId,
                pattern: rPattern.trim(),
                field: rField,
                accountId: rAccountId,
                priority: rPriority,
                active: rActive,
            };
            if (editingRule) await apiClient.put(`/finance/rules/${editingRule.id}`, payload);
            else await apiClient.post('/finance/rules', payload);
            setRModalOpen(false);
            await loadRules();
        } catch (e: any) {
            setError(e?.message || 'Failed to save rule');
        } finally { setLoading(false); }
    };
    const deleteRule = async (r: FinanceRule) => {
        const ok = window.confirm('Delete rule?');
        if (!ok) return;
        try {
            setLoading(true);
            setError(null);
            await apiClient.delete(`/finance/rules/${r.id}`);
            await loadRules();
        } catch (e: any) {
            setError(e?.message || 'Failed to delete rule');
        } finally { setLoading(false); }
    };

    return (
        <Box maxWidth={1400} mx="auto" px={{xs: 1, sm: 2, md: 3}}>
            <Typography variant="h5" fontWeight={600} gutterBottom>{heading}</Typography>
            <Paper elevation={0} variant="outlined" sx={{p: 1.5, borderRadius: 2}}>
                <Tabs value={tab} onChange={changeTab} variant="scrollable" allowScrollButtonsMobile sx={{
                    '& .MuiTab-root': {textTransform: 'none', fontWeight: 500, minHeight: 44},
                    '& .MuiTabs-indicator': {height: 3}
                }}>
                    <Tab label="Journal" value="journal"/>
                    <Tab label="Assets" value="assets"/>
                    <Tab label="Liabilities" value="liabilities"/>
                    <Tab label="Vendors / Suppliers" value="vendors"/>
                    <Tab label="Rules" value="rules"/>
                    <Tab label="Import" value="import"/>
                    <Tab label="Export" value="export"/>
                    <Tab label="Projections" value="projections"/>
                </Tabs>
                <Divider sx={{mb: 2}}/>
                {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}
                
                {tab === 'vendors' && (
                    <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                            <Typography variant="subtitle1" fontWeight={600}>Vendors & Suppliers</Typography>
                            <Tooltip title="Add Vendor"><span><Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openCreateVendor} disabled={loading}>Add</Button></span></Tooltip>
                        </Stack>
                        <Paper variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell sx={{width: 160}}>Category</TableCell>
                                        <TableCell>Default Account</TableCell>
                                        <TableCell>Notes</TableCell>
                                        <TableCell align="right" sx={{width: 80}}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading && (<TableRow><TableCell colSpan={5}><Box display="flex" alignItems="center" gap={1}><CircularProgress size={18}/><Typography variant="caption" color="text.secondary">Loading…</Typography></Box></TableCell></TableRow>)}
                                    {!loading && vendors.length === 0 && (<TableRow><TableCell colSpan={5}><Typography variant="caption" color="text.secondary">No vendors</Typography></TableCell></TableRow>)}
                                    {!loading && vendors.map(v => {
                                        const acct = accountsAll.find(a => a.id === v.defaultAccountId);
                                        return (
                                            <TableRow key={v.id} hover>
                                                <TableCell><Typography variant="body2" fontWeight={500}>{v.name}</Typography></TableCell>
                                                <TableCell><Typography variant="body2">{v.category || '—'}</Typography></TableCell>
                                                <TableCell><Typography variant="body2">{acct ? `${acct.code ? acct.code + ' ' : ''}${acct.name}` : '—'}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" noWrap title={v.notes || ''}>{v.notes || '—'}</Typography></TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                                                        <Tooltip title="Edit"><span><IconButton size="small" onClick={() => openEditVendor(v)} disabled={loading}><EditIcon fontSize="small"/></IconButton></span></Tooltip>
                                                        <Tooltip title="Delete"><span><IconButton size="small" onClick={() => deleteVendor(v)} disabled={loading}><DeleteOutlineIcon fontSize="small"/></IconButton></span></Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Paper>

                        <Dialog open={vModalOpen} onClose={closeVendorModal} maxWidth="sm" fullWidth>
                            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Create Vendor'}</DialogTitle>
                            <DialogContent dividers>
                                <Stack spacing={1.5}>
                                    <TextField size="small" label="Name" value={vName} onChange={e => setVName(e.target.value)} required fullWidth />
                                    <Stack direction={{xs:'column', sm:'row'}} spacing={1.5}>
                                        <TextField size="small" label="Category" value={vCategory} onChange={e => setVCategory(e.target.value)} sx={{minWidth: 200}} />
                                        <TextField select size="small" label="Default Account" value={vDefaultAccountId} onChange={e => setVDefaultAccountId(e.target.value)} sx={{minWidth: 260}}>
                                            <MenuItem value=""><em>None</em></MenuItem>
                                            {accountsAll.map(a => (
                                                <MenuItem key={a.id} value={a.id}>{a.code ? `${a.code} ` : ''}{a.name}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Stack>
                                    <TextField size="small" label="Notes" value={vNotes} onChange={e => setVNotes(e.target.value)} fullWidth multiline minRows={2} />
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                {editingVendor && (<Tooltip title="Delete"><span><Button color="error" startIcon={<DeleteOutlineIcon/>} onClick={() => editingVendor && deleteVendor(editingVendor)} disabled={loading}>Delete</Button></span></Tooltip>)}
                                <Box flexGrow={1} />
                                <Button onClick={closeVendorModal}>Cancel</Button>
                                <Button variant="contained" onClick={saveVendor} disabled={loading || !vName.trim()}>{editingVendor ? 'Save' : 'Create'}</Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
                {tab === 'rules' && (
                    <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                            <Typography variant="subtitle1" fontWeight={600}>Categorization Rules</Typography>
                            <Tooltip title="Add Rule"><span><Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openCreateRule} disabled={loading}>Add</Button></span></Tooltip>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            Example: if line item contains &quot;Shell&quot; then categorize to the selected gas/fuel ledger account.
                        </Typography>
                        <Paper variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Pattern</TableCell>
                                        <TableCell sx={{width: 140}}>Field</TableCell>
                                        <TableCell>Target Account</TableCell>
                                        <TableCell sx={{width: 100}}>Priority</TableCell>
                                        <TableCell sx={{width: 100}}>Active</TableCell>
                                        <TableCell align="right" sx={{width: 80}}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading && (<TableRow><TableCell colSpan={6}><Box display="flex" alignItems="center" gap={1}><CircularProgress size={18}/><Typography variant="caption" color="text.secondary">Loading…</Typography></Box></TableCell></TableRow>)}
                                    {!loading && rules.length === 0 && (<TableRow><TableCell colSpan={6}><Typography variant="caption" color="text.secondary">No rules</Typography></TableCell></TableRow>)}
                                    {!loading && rules.map(r => {
                                        const acct = accountsAll.find(a => a.id === r.accountId);
                                        return (
                                            <TableRow key={r.id} hover>
                                                <TableCell><Typography variant="body2" sx={{fontFamily:'monospace'}}>{r.pattern}</Typography></TableCell>
                                                <TableCell><Typography variant="body2">{r.field}</Typography></TableCell>
                                                <TableCell><Typography variant="body2">{acct ? `${acct.code ? acct.code + ' ' : ''}${acct.name}` : '—'}</Typography></TableCell>
                                                <TableCell><Typography variant="body2">{typeof r.priority === 'number' ? r.priority : 100}</Typography></TableCell>
                                                <TableCell><Chip size="small" color={r.active === false ? 'default' : 'success'} label={r.active === false ? 'No' : 'Yes'} /></TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                                                        <Tooltip title="Edit"><span><IconButton size="small" onClick={() => openEditRule(r)} disabled={loading}><EditIcon fontSize="small"/></IconButton></span></Tooltip>
                                                        <Tooltip title="Delete"><span><IconButton size="small" onClick={() => deleteRule(r)} disabled={loading}><DeleteOutlineIcon fontSize="small"/></IconButton></span></Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Paper>

                        <Dialog open={rModalOpen} onClose={closeRuleModal} maxWidth="sm" fullWidth>
                            <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
                            <DialogContent dividers>
                                <Stack spacing={1.5}>
                                    <TextField size="small" label="Pattern (substring or regex)" value={rPattern} onChange={e => setRPattern(e.target.value)} fullWidth required />
                                    <Stack direction={{xs:'column', sm:'row'}} spacing={1.5}>
                                        <TextField select size="small" label="Field" value={rField} onChange={e => setRField(e.target.value as any)} sx={{minWidth: 180}}>
                                            <MenuItem value="memo">Memo</MenuItem>
                                            <MenuItem value="reference">Reference</MenuItem>
                                            <MenuItem value="merchant">Merchant</MenuItem>
                                            <MenuItem value="lineItem">Line Item</MenuItem>
                                        </TextField>
                                        <TextField select size="small" label="Target Account" value={rAccountId} onChange={e => setRAccountId(e.target.value)} sx={{minWidth: 260}}>
                                            <MenuItem value=""><em>Select account…</em></MenuItem>
                                            {accountsAll.map(a => (
                                                <MenuItem key={a.id} value={a.id}>{a.code ? `${a.code} ` : ''}{a.name}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Stack>
                                    <Stack direction={{xs:'column', sm:'row'}} spacing={1.5}>
                                        <TextField type="number" size="small" label="Priority" value={rPriority} onChange={e => setRPriority(Number(e.target.value))} sx={{minWidth: 140}} />
                                        <FormControlLabel control={<Checkbox checked={rActive} onChange={e => setRActive(e.target.checked)} />} label="Active" />
                                    </Stack>
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                {editingRule && (<Tooltip title="Delete"><span><Button color="error" startIcon={<DeleteOutlineIcon/>} onClick={() => editingRule && deleteRule(editingRule)} disabled={loading}>Delete</Button></span></Tooltip>)}
                                <Box flexGrow={1} />
                                <Button onClick={closeRuleModal}>Cancel</Button>
                                <Button variant="contained" onClick={saveRule} disabled={loading || !rPattern.trim() || !rAccountId}>{editingRule ? 'Save' : 'Create'}</Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
                
                {(tab === 'assets' || tab === 'liabilities') && (
                    <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                            <Typography variant="subtitle1" fontWeight={600}>{tab === 'assets' ? 'Assets' : 'Liabilities'}</Typography>
                            <Tooltip title={`Add ${tab === 'assets' ? 'Asset' : 'Liability'}`}>
                                <span>
                                    <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={loading}>Add</Button>
                                </span>
                            </Tooltip>
                        </Stack>
                        <Paper variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{width: 120}}>Code</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell sx={{width: 100}}>Currency</TableCell>
                                        <TableCell align="right" sx={{width: 160}}>Balance</TableCell>
                                        <TableCell align="right" sx={{width: 100}}>Type</TableCell>
                                        <TableCell align="right" sx={{width: 80}}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading && (
                                        <TableRow><TableCell colSpan={7}><Box display="flex" alignItems="center" gap={1}><CircularProgress size={18}/><Typography variant="caption" color="text.secondary">Loading…</Typography></Box></TableCell></TableRow>
                                    )}
                                    {!loading && finAccounts.length === 0 && (
                                        <TableRow><TableCell colSpan={7}><Typography variant="caption" color="text.secondary">No accounts</Typography></TableCell></TableRow>
                                    )}
                                    {!loading && finAccounts.map(a => (
                                        <TableRow key={a.id} hover>
                                            <TableCell><Typography variant="body2" sx={{fontFamily:'monospace'}}>{a.code || '—'}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{a.name}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" noWrap title={a.description || ''}>{a.description || '—'}</Typography></TableCell>
                                            <TableCell><Chip size="small" label={a.currency}/></TableCell>
                                            <TableCell align="right"><Typography variant="body2">{formatMoney(a.currency, a.balanceCents)}</Typography></TableCell>
                                            <TableCell align="right"><Chip size="small" label={a.type}/></TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                                                    <Tooltip title="Edit"><span><IconButton size="small" onClick={() => openEdit(a)} disabled={loading}><EditIcon fontSize="small"/></IconButton></span></Tooltip>
                                                    <Tooltip title="Delete"><span><IconButton size="small" onClick={() => deleteAccount(a)} disabled={loading}><DeleteOutlineIcon fontSize="small"/></IconButton></span></Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>

                        <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
                            <DialogTitle>{editing ? `Edit ${tab === 'assets' ? 'Asset' : 'Liability'}` : `Create ${tab === 'assets' ? 'Asset' : 'Liability'}`}</DialogTitle>
                            <DialogContent dividers>
                                <Stack spacing={1.5}>
                                    <Stack direction={{xs:'column', sm:'row'}} spacing={1.5}>
                                        <TextField size="small" label="Name" value={fName} onChange={e => setFName(e.target.value)} fullWidth required />
                                        <TextField size="small" label="Code" value={fCode} onChange={e => setFCode(e.target.value)} sx={{minWidth: 160}} />
                                    </Stack>
                                    <Stack direction={{xs:'column', sm:'row'}} spacing={1.5}>
                                        <TextField size="small" label="Currency" value={fCurrency} onChange={e => setFCurrency(e.target.value.toUpperCase())} error={!isCurrencyValid} helperText={!isCurrencyValid?'3-letter code':' '} sx={{minWidth: 140}} />
                                        <TextField size="small" label="Opening Balance" value={fBalance} onChange={e => setFBalance(e.target.value)} placeholder="0.00" sx={{minWidth: 160}} />
                                    </Stack>
                                    <TextField size="small" label="Description" value={fDesc} onChange={e => setFDesc(e.target.value)} fullWidth multiline minRows={2} />
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                {editing && (<Tooltip title="Delete"><span><Button color="error" startIcon={<DeleteOutlineIcon/>} onClick={() => editing && deleteAccount(editing)} disabled={loading}>Delete</Button></span></Tooltip>)}
                                <Box flexGrow={1} />
                                <Button onClick={closeModal}>Cancel</Button>
                                <Button variant="contained" onClick={saveAccount} disabled={loading || !fName.trim() || !isCurrencyValid}>{editing ? 'Save' : 'Create'}</Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
                {tab === 'journal' && (
                    <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                            <Typography variant="subtitle1" fontWeight={600}>Journal</Typography>
                            <Tooltip title="Add Entry"><span><Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openCreateTxn} disabled={loading}>Add</Button></span></Tooltip>
                        </Stack>
                        <Paper variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{width: 120}}>Date</TableCell>
                                        <TableCell sx={{width: 140}}>Reference</TableCell>
                                        <TableCell>Memo</TableCell>
                                        <TableCell sx={{width: 100}}>Currency</TableCell>
                                        <TableCell align="right" sx={{width: 150}}>Debits</TableCell>
                                        <TableCell align="right" sx={{width: 150}}>Credits</TableCell>
                                        <TableCell align="right" sx={{width: 80}}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading && (<TableRow><TableCell colSpan={7}><Box display="flex" alignItems="center" gap={1}><CircularProgress size={18}/><Typography variant="caption" color="text.secondary">Loading…</Typography></Box></TableCell></TableRow>)}
                                    {!loading && txns.length === 0 && (<TableRow><TableCell colSpan={7}><Typography variant="caption" color="text.secondary">No transactions</Typography></TableCell></TableRow>)}
                                    {!loading && txns.map(t => {
                                        const totals = (t.lines||[]).reduce((acc, l) => { acc.d += (l.debitCents||0); acc.c += (l.creditCents||0); return acc; }, {d:0,c:0});
                                        return (
                                            <TableRow key={t.id} hover sx={{cursor: 'pointer'}} onClick={() => openEditTxn(t)}>
                                                <TableCell><Typography variant="body2">{(t.date||'').slice(0,10)}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" sx={{fontFamily:'monospace'}}>{t.reference || '—'}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" noWrap title={t.memo || ''}>{t.memo || '—'}</Typography></TableCell>
                                                <TableCell><Chip size="small" label={t.currency}/></TableCell>
                                                <TableCell align="right"><Typography variant="body2">{formatMoney(t.currency, totals.d)}</Typography></TableCell>
                                                <TableCell align="right"><Typography variant="body2">{formatMoney(t.currency, totals.c)}</Typography></TableCell>
                                                <TableCell align="right" onClick={e => e.stopPropagation()}>
                                                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditTxn(t)}><EditIcon fontSize="small"/></IconButton></Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Paper>

                        <Dialog open={txnModalOpen} onClose={closeTxnModal} maxWidth="md" fullWidth>
                            <DialogTitle>{editingTxn ? 'Edit Entry' : 'Create Entry'}</DialogTitle>
                            <DialogContent dividers>
                                <Stack spacing={1.5}>
                                    <Stack direction={{xs:'column', sm:'row'}} spacing={1.5}>
                                        <TextField size="small" label="Date" type="date" value={tDate} onChange={e => setTDate(e.target.value)} sx={{minWidth: 180}} InputLabelProps={{shrink: true}} />
                                        <TextField size="small" label="Currency" value={tCurrency} onChange={e => setTCurrency(e.target.value.toUpperCase())} error={!isTxnCurrencyValid} helperText={!isTxnCurrencyValid?'3-letter code':' '} sx={{minWidth: 120}} />
                                        <TextField size="small" label="Reference" value={tReference} onChange={e => setTReference(e.target.value)} sx={{minWidth: 160}} />
                                    </Stack>
                                    <TextField size="small" label="Memo" value={tMemo} onChange={e => setTMemo(e.target.value)} fullWidth />

                                    <Paper variant="outlined" sx={{p:1}}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Account</TableCell>
                                                    <TableCell>Description</TableCell>
                                                    <TableCell align="right" sx={{width:140}}>Debit</TableCell>
                                                    <TableCell align="right" sx={{width:140}}>Credit</TableCell>
                                                    <TableCell align="right" sx={{width:60}}></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {tLines.map((ln, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell sx={{minWidth: 260}}>
                                                            <TextField select size="small" fullWidth value={ln.accountId} onChange={e => setTxnLineField(idx, 'accountId', e.target.value)}>
                                                                <MenuItem value=""><em>Select account…</em></MenuItem>
                                                                {accountsAll.map(a => (
                                                                    <MenuItem key={a.id} value={a.id}>{a.code ? `${a.code} `: ''}{a.name}</MenuItem>
                                                                ))}
                                                            </TextField>
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField size="small" fullWidth value={ln.description} onChange={e => setTxnLineField(idx, 'description', e.target.value)} placeholder="Optional" />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <TextField size="small" value={ln.debit} onChange={e => setTxnLineField(idx, 'debit', e.target.value)} placeholder="0.00" inputProps={{style:{textAlign:'right'}}} />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <TextField size="small" value={ln.credit} onChange={e => setTxnLineField(idx, 'credit', e.target.value)} placeholder="0.00" inputProps={{style:{textAlign:'right'}}} />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Tooltip title="Remove line"><IconButton size="small" onClick={() => removeTxnLine(idx)}><DeleteOutlineIcon fontSize="small"/></IconButton></Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell colSpan={5}>
                                                        <Button size="small" startIcon={<AddIcon />} onClick={addTxnLine}>Add line</Button>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell colSpan={2} align="right"><Typography variant="subtitle2">Totals</Typography></TableCell>
                                                    <TableCell align="right"><Typography variant="subtitle2">{formatMoney(tCurrency, txnTotals.debit)}</Typography></TableCell>
                                                    <TableCell align="right"><Typography variant="subtitle2">{formatMoney(tCurrency, txnTotals.credit)}</Typography></TableCell>
                                                    <TableCell align="right">
                                                        <Chip size="small" color={txnTotals.balanced? 'success':'warning'} label={txnTotals.balanced? 'Balanced':'Not balanced'} />
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Paper>
                                </Stack>
                            </DialogContent>
                            <DialogActions>
                                {editingTxn && (<Tooltip title="Delete"><span><Button color="error" startIcon={<DeleteOutlineIcon/>} onClick={deleteTxn} disabled={loading}>Delete</Button></span></Tooltip>)}
                                <Box flexGrow={1} />
                                <Button onClick={closeTxnModal}>Cancel</Button>
                                <Button variant="contained" onClick={saveTxn} disabled={loading || !isTxnCurrencyValid || !tDate || !txnTotals.balanced}>{editingTxn ? 'Save' : 'Create'}</Button>
                            </DialogActions>
                        </Dialog>
                    </Box>
                )}
                {tab === 'import' && (
                    <Box>
                        <Typography variant="body2" mb={2}>Upload a CSV or JSON file. We&apos;ll send the raw content to the server for parsing and import. Preview shows the first few lines.</Typography>
                        <Stack direction={{xs:'column', sm:'row'}} spacing={1.5} alignItems={{xs:'stretch', sm:'center'}} mb={2}>
                            <input id="fin-import-file" type="file" accept=".csv,.json,text/csv,application/json" style={{display:'none'}} onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                const text = await f.text();
                                setImportFileName(f.name);
                                setImportText(text);
                                const lines = text.split(/\r?\n/).slice(0, 10);
                                setImportPreview(lines);
                            }} />
                            <label htmlFor="fin-import-file">
                                <Button variant="outlined" component="span">Choose File…</Button>
                            </label>
                            <Typography variant="body2" flexGrow={1}>{importFileName ? importFileName : 'No file selected'}</Typography>
                            <Button variant="contained" disabled={!importText || loading} onClick={async () => {
                                try {
                                    setLoading(true);
                                    setError(null);
                                    await apiClient.post('/finance/import', { tenantId, filename: importFileName, content: importText });
                                    setImportText('');
                                    setImportFileName('');
                                    setImportPreview([]);
                                    // Reload transactions to reflect any imported data
                                    await loadTransactions();
                                } catch (e: any) {
                                    setError(e?.message || 'Import failed');
                                } finally { setLoading(false); }
                            }}>Import</Button>
                        </Stack>
                        <Paper variant="outlined" sx={{p: 2}}>
                            <Typography variant="subtitle2" gutterBottom>Preview</Typography>
                            {importPreview.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">No preview available</Typography>
                            ) : (
                                <Box component="pre" sx={{whiteSpace:'pre-wrap', fontSize: 12, m:0}}>{importPreview.join('\n')}</Box>
                            )}
                        </Paper>
                    </Box>
                )}
                {tab === 'export' && (
                    <Box>
                        <Typography variant="body2" mb={2}>Export current accounts and journal entries. Files are generated client-side.</Typography>
                        <Stack direction={{xs:'column', sm:'row'}} spacing={1.5} mb={2}>
                            <Button variant="outlined" onClick={() => downloadText(`accounts-${Date.now()}.csv`, toCsvAccounts(accountsAll))} disabled={loading}>Export Accounts CSV</Button>
                            <Button variant="outlined" onClick={() => downloadText(`accounts-${Date.now()}.json`, JSON.stringify(accountsAll, null, 2))} disabled={loading}>Export Accounts JSON</Button>
                        </Stack>
                        <Stack direction={{xs:'column', sm:'row'}} spacing={1.5}>
                            <Button variant="outlined" onClick={() => downloadText(`journal-${Date.now()}.csv`, toCsvTransactions(txns))} disabled={loading}>Export Journal CSV</Button>
                            <Button variant="outlined" onClick={() => downloadText(`journal-${Date.now()}.json`, JSON.stringify(txns, null, 2))} disabled={loading}>Export Journal JSON</Button>
                        </Stack>
                    </Box>
                )}
                {tab === 'projections' && (
                    <Box>
                        <Typography variant="body2" mb={2}>6-month simple projection based on current balances (illustrative).</Typography>
                        <Paper variant="outlined" sx={{p:2, mb:2}}>
                            <Typography variant="subtitle2" gutterBottom>Balances by Currency</Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                {groupBalancesByCurrency(accountsAll).map(([cur, cents]) => (
                                    <Paper key={cur} variant="outlined" sx={{p:1.5, minWidth: 180}}>
                                        <Typography variant="caption" color="text.secondary">{cur}</Typography>
                                        <Typography variant="h6">{formatMoney(cur, cents)}</Typography>
                                    </Paper>
                                ))}
                                {groupBalancesByCurrency(accountsAll).length === 0 && (
                                    <Typography variant="caption" color="text.secondary">No accounts</Typography>
                                )}
                            </Stack>
                        </Paper>
                        <Paper variant="outlined" sx={{p:2}}>
                            <Typography variant="subtitle2" gutterBottom>6-Month Projection (USD)</Typography>
                            <ProjectionBars series={buildSimpleProjectionUSD(accountsAll)} />
                        </Paper>
                        <Paper variant="outlined" sx={{p:2, mt:2}}>
                            <Stack direction={{xs:'column', sm:'row'}} alignItems={{xs:'flex-start', sm:'center'}} spacing={1.5} mb={1.5}>
                                <Typography variant="subtitle2" flexGrow={1}>Sequence Diagram (Income vs Expenses)</Typography>
                                <TextField select size="small" label="Granularity" value={projPeriod} onChange={e => setProjPeriod(e.target.value as any)} sx={{minWidth: 180}}>
                                    <MenuItem value="monthly">Monthly</MenuItem>
                                    <MenuItem value="quarterly">Quarterly</MenuItem>
                                    <MenuItem value="annually">Annually</MenuItem>
                                </TextField>
                            </Stack>
                            {txns.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">No journal entries to display</Typography>
                            ) : (
                                <MermaidDiagram code={buildIncomeExpenseSequence(txns, projPeriod)} />
                            )}
                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>Note: As a placeholder, credits are treated as income and debits as expenses for visualization only.</Typography>
                        </Paper>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}

// Helpers
function toCents(input: string): number {
    const cleaned = (input || '').replace(/[^\d.]/g, '');
    const value = parseFloat(cleaned);
    if (!isFinite(value)) return 0;
    return Math.round(value * 100);
}

function fromCents(cents: number): string {
    const v = (typeof cents === 'number' ? cents : 0) / 100;
    return Number.isFinite(v) ? v.toFixed(2) : '0.00';
}

function formatMoney(currency: string, cents: number): string {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format((cents || 0) / 100);
    } catch {
        return ((cents || 0) / 100).toFixed(2);
    }
}

// Export helpers
function downloadText(filename: string, text: string) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function toCsvTransactions(txns: FinanceTxn[]): string {
    const header = ['id','date','currency','reference','memo','lineAccountId','lineDescription','debitCents','creditCents'];
    const rows: string[] = [header.join(',')];
    for (const t of txns) {
        for (const l of (t.lines||[])) {
            const vals = [
                escCsv(t.id),
                escCsv((t.date||'').slice(0,10)),
                escCsv(t.currency||''),
                escCsv(t.reference||''),
                escCsv(t.memo||''),
                escCsv(l.accountId||''),
                escCsv(l.description||''),
                String(l.debitCents||0),
                String(l.creditCents||0),
            ];
            rows.push(vals.join(','));
        }
    }
    return rows.join('\r\n');
}

function toCsvAccounts(accts: FinanceAccount[]): string {
    const header = ['id','type','code','name','currency','balanceCents','description'];
    const rows: string[] = [header.join(',')];
    for (const a of accts) {
        const vals = [
            escCsv(a.id),
            escCsv(a.type),
            escCsv(a.code||''),
            escCsv(a.name||''),
            escCsv(a.currency||'USD'),
            String(a.balanceCents||0),
            escCsv(a.description||''),
        ];
        rows.push(vals.join(','));
    }
    return rows.join('\r\n');
}

function escCsv(v: string): string {
    if (v == null) return '';
    if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
    return v;
}

function groupBalancesByCurrency(accts: FinanceAccount[]): [string, number][] {
    const m = new Map<string, number>();
    for (const a of accts) {
        const cur = a.currency || 'USD';
        m.set(cur, (m.get(cur)||0) + (a.balanceCents||0));
    }
    return Array.from(m.entries());
}

// Simple projections: assume 1% monthly growth on net USD balance
function buildSimpleProjectionUSD(accts: FinanceAccount[]): { month: string; cents: number }[] {
    const now = new Date();
    const usd = accts.filter(a => (a.currency||'USD') === 'USD').reduce((s, a) => s + (a.balanceCents||0), 0);
    const series: { month: string; cents: number }[] = [];
    let cur = usd;
    for (let i=0;i<6;i++) {
        const d = new Date(now.getFullYear(), now.getMonth()+i+1, 1);
        cur = Math.round(cur * 1.01); // +1%
        series.push({ month: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), cents: cur });
    }
    return series;
}

// Minimal inline bar chart
function ProjectionBars({ series }: { series: { month: string; cents: number }[] }) {
    const max = Math.max(1, ...series.map(s => s.cents));
    return (
        <div style={{display:'flex', gap: 12, alignItems:'flex-end'}}>
            {series.map(s => {
                const h = Math.max(8, Math.round((s.cents/max) * 160));
                return (
                    <div key={s.month} style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                        <div style={{height: h, width: 28, background:'#1976d2', borderRadius: 4}} title={`${s.month}: ${formatMoney('USD', s.cents)}`} />
                        <div style={{marginTop: 6, fontSize: 12}}>{s.month}</div>
                    </div>
                );
            })}
        </div>
    );
}

// --- Income/Expense sequence diagram helpers ---
function buildIncomeExpenseSequence(txns: FinanceTxn[], period: 'monthly'|'quarterly'|'annually'): string {
    const buckets = aggregateByPeriod(txns, period);
    const recent = buckets.slice(-8); // limit the number of periods shown
    const lines: string[] = ['sequenceDiagram', 'participant Timeline', 'participant Income', 'participant Expenses'];
    for (const b of recent) {
        if (b.incomeCents > 0) lines.push(`Timeline->>Income: ${b.label} +${fromCents(b.incomeCents)}`);
        if (b.expenseCents > 0) lines.push(`Timeline->>Expenses: ${b.label} -${fromCents(b.expenseCents)}`);
        if (b.incomeCents === 0 && b.expenseCents === 0) lines.push(`Note over Timeline: ${b.label} (no activity)`);
    }
    return lines.join('\n');
}

function aggregateByPeriod(txns: FinanceTxn[], period: 'monthly'|'quarterly'|'annually') {
    type Agg = { key: string; label: string; incomeCents: number; expenseCents: number };
    const map = new Map<string, Agg>();
    for (const t of txns) {
        const d = new Date(t.date);
        const { key, label } = periodKeyAndLabel(d, period);
        const agg = map.get(key) || { key, label, incomeCents: 0, expenseCents: 0 };
        const sums = (t.lines||[]).reduce((acc, l) => { acc.c += (l.creditCents||0); acc.d += (l.debitCents||0); return acc; }, {c:0,d:0});
        agg.incomeCents += sums.c; // heuristic: credits as income
        agg.expenseCents += sums.d; // heuristic: debits as expense
        map.set(key, agg);
    }
    return Array.from(map.values()).sort((a,b) => a.key.localeCompare(b.key));
}

function periodKeyAndLabel(d: Date, period: 'monthly'|'quarterly'|'annually') {
    const y = d.getFullYear();
    if (period === 'annually') {
        return { key: `${y}`, label: `${y}` };
    }
    if (period === 'quarterly') {
        const q = Math.floor(d.getMonth()/3)+1;
        return { key: `${y}-Q${q}`, label: `Q${q} ${y}` };
    }
    // monthly
    const m = d.getMonth();
    const key = `${y}-${String(m+1).padStart(2,'0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    return { key, label };
}

function MermaidDiagram({ code }: { code: string }) {
    const ref = React.useRef<HTMLDivElement>(null);
    const idRef = React.useRef(`mermaid-${Math.random().toString(36).slice(2)}`);
    useEffect(() => {
        let mounted = true;
        (async () => {
            const mermaid = (await import('mermaid')).default;
            try {
                mermaid.initialize({ startOnLoad: false, theme: 'default' });
                const { svg } = await mermaid.render(idRef.current, code);
                if (mounted && ref.current) {
                    ref.current.innerHTML = svg;
                }
            } catch (e) {
                if (mounted && ref.current) {
                    ref.current.innerHTML = '<div style="color:#d32f2f">Failed to render diagram</div>';
                }
            }
        })();
        return () => { mounted = false; };
    }, [code]);
    return <div ref={ref} />;
}