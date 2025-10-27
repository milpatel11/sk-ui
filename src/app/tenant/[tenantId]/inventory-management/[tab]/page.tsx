"use client";
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import {DataGrid, GridColDef} from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import type {InventoryCategory, InventoryItem, InventoryLocation, InventoryMovement} from '@/lib/types';
import {apiClient} from '@/lib/apiClient';

const VALID_TABS = ["dashboard", "items", "categories", "locations", "movements"] as const;
type InvTab = typeof VALID_TABS[number];
const STORAGE_KEY_PREFIX = 'inventory:lastTab:';

interface TabPanelProps {
    active: InvTab;
    me: InvTab;
    children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({active, me, children}) => active === me ?
    <Box pt={2}>{children}</Box> : null;

export default function InventoryManagementTabPage() {
    const pathname = usePathname(); // /tenant/{tenantId}/inventory-management/{tab}
    const router = useRouter();
    const parts = pathname.split('/').filter(Boolean); // ['tenant', '{tenantId}', 'inventory-management', '{tab}']
    const tenantId = parts[1];
    const routeTab = parts[3] as string | undefined;
    const initialTab: InvTab = (routeTab && (VALID_TABS as readonly string[]).includes(routeTab)) ? routeTab as InvTab : 'dashboard';
    const [tab, setTab] = useState<InvTab>(initialTab);

    // Data state
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<InventoryCategory[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Dialog state
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
    const [locationDialogOpen, setLocationDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<InventoryLocation | null>(null);
    const [movementDialogOpen, setMovementDialogOpen] = useState(false);
    const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Forms
    const [itemForm, setItemForm] = useState({
        sku: '',
        name: '',
        categoryId: '',
        locationId: '',
        quantity: 0,
        reorderLevel: 0,
        description: ''
    });
    const [categoryForm, setCategoryForm] = useState({name: '', description: ''});
    const [locationForm, setLocationForm] = useState({name: '', description: ''});
    const [movementForm, setMovementForm] = useState({delta: 0, reason: ''});

    // URL normalization
    useEffect(() => {
        if (!routeTab || !(VALID_TABS as readonly string[]).includes(routeTab)) {
            router.replace(`/tenant/${tenantId}/inventory-management/dashboard`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist tab
    useEffect(() => {
        if (typeof window !== 'undefined' && tenantId) localStorage.setItem(STORAGE_KEY_PREFIX + tenantId, tab);
    }, [tab, tenantId]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [itemsR, catR, locR, movR] = await Promise.all([
                apiClient.get('/inventory/items'),
                apiClient.get('/inventory/categories'),
                apiClient.get('/inventory/locations'),
                apiClient.get('/inventory/movements')
            ]);
            setItems(Array.isArray(itemsR.data) ? itemsR.data : []);
            setCategories(Array.isArray(catR.data) ? catR.data : []);
            setLocations(Array.isArray(locR.data) ? locR.data : []);
            setMovements(Array.isArray(movR.data) ? movR.data : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const changeTab = useCallback((_: React.SyntheticEvent, value: string) => {
        if (value === tab) return;
        if ((VALID_TABS as readonly string[]).includes(value)) {
            setTab(value as InvTab);
            router.replace(`/tenant/${tenantId}/inventory-management/${value}`);
        }
    }, [tab, tenantId, router]);

    const heading = useMemo(() => {
        switch (tab) {
            case 'dashboard':
                return 'Inventory Dashboard';
            case 'items':
                return 'Items';
            case 'categories':
                return 'Categories';
            case 'locations':
                return 'Locations';
            case 'movements':
                return 'Stock Movements';
            default:
                return 'Inventory';
        }
    }, [tab]);

    const totalItems = items.length;
    const totalQuantity = items.reduce((acc, i) => acc + (i.quantity || 0), 0);
    const lowStock = items.filter(i => i.reorderLevel !== undefined && i.reorderLevel !== null && i.quantity <= (i.reorderLevel || 0)).length;
    const totalCategories = categories.length;

    // Column definitions
    const categoryLookup: Record<string, string> = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.name])), [categories]);
    const locationLookup: Record<string, string> = useMemo(() => Object.fromEntries(locations.map(l => [l.id, l.name])), [locations]);

    const itemColumns: GridColDef[] = [
        {field: 'sku', headerName: 'SKU', width: 140},
        {field: 'name', headerName: 'Name', flex: 1},
        {
            field: 'categoryId', headerName: 'Category', width: 160, valueFormatter: (p) => {
                const v = (p as any).value as string | undefined;
                return v ? (categoryLookup[v] || '') : '';
            }
        },
        {
            field: 'locationId', headerName: 'Location', width: 160, valueFormatter: (p) => {
                const v = (p as any).value as string | undefined;
                return v ? (locationLookup[v] || '') : '';
            }
        },
        {field: 'quantity', headerName: 'Qty', width: 90},
        {field: 'reorderLevel', headerName: 'Reorder', width: 110},
        {
            field: 'actions', headerName: '', width: 130, sortable: false, filterable: false, renderCell: params => (
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" aria-label="adjust" onClick={() => {
                        const it = items.find(i => i.id === params.row.id);
                        if (it) {
                            setMovementItem(it);
                            setMovementForm({delta: 0, reason: ''});
                            setMovementDialogOpen(true);
                        }
                    }}>
                        <TrendingUpIcon fontSize="inherit"/>
                    </IconButton>
                    <IconButton size="small" aria-label="edit" onClick={() => {
                        const it = items.find(i => i.id === params.row.id);
                        if (it) {
                            setEditingItem(it);
                            setItemForm({
                                sku: it.sku,
                                name: it.name,
                                categoryId: it.categoryId || '',
                                locationId: it.locationId || '',
                                quantity: it.quantity,
                                reorderLevel: it.reorderLevel || 0,
                                description: it.description || ''
                            });
                            setItemDialogOpen(true);
                        }
                    }}>
                        <EditIcon fontSize="inherit"/>
                    </IconButton>
                    <IconButton size="small" aria-label="delete" onClick={() => handleDeleteItem(params.row.id)}>
                        <DeleteIcon fontSize="inherit"/>
                    </IconButton>
                </Stack>
            )
        }
    ];

    const categoryColumns: GridColDef[] = [
        {field: 'name', headerName: 'Name', flex: 1},
        {field: 'description', headerName: 'Description', flex: 2},
        {
            field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, renderCell: params => (
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => {
                        const c = categories.find(x => x.id === params.row.id);
                        if (c) {
                            setEditingCategory(c);
                            setCategoryForm({name: c.name, description: c.description || ''});
                            setCategoryDialogOpen(true);
                        }
                    }}><EditIcon fontSize="inherit"/></IconButton>
                    <IconButton size="small" onClick={() => handleDeleteCategory(params.row.id)}><DeleteIcon
                        fontSize="inherit"/></IconButton>
                </Stack>
            )
        }
    ];

    const locationColumns: GridColDef[] = [
        {field: 'name', headerName: 'Name', flex: 1},
        {field: 'description', headerName: 'Description', flex: 2},
        {
            field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, renderCell: params => (
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => {
                        const l = locations.find(x => x.id === params.row.id);
                        if (l) {
                            setEditingLocation(l);
                            setLocationForm({name: l.name, description: l.description || ''});
                            setLocationDialogOpen(true);
                        }
                    }}><EditIcon fontSize="inherit"/></IconButton>
                    <IconButton size="small" onClick={() => handleDeleteLocation(params.row.id)}><DeleteIcon
                        fontSize="inherit"/></IconButton>
                </Stack>
            )
        }
    ];

    const movementColumns: GridColDef[] = [
        {
            field: 'createdAt', headerName: 'When', width: 190, valueFormatter: (p) => {
                const v = (p as any).value as string | undefined;
                return v ? new Date(v).toLocaleString() : '';
            }
        },
        {
            field: 'itemId', headerName: 'Item', flex: 1, valueFormatter: (p) => {
                const v = (p as any).value as string | undefined;
                return v ? (items.find(i => i.id === v)?.name || '') : '';
            }
        },
        {
            field: 'delta',
            headerName: 'Δ',
            width: 80,
            renderCell: p => <Typography
                color={(p.row.delta || 0) >= 0 ? 'success.main' : 'error.main'}>{p.row.delta}</Typography>
        },
        {field: 'resultingQuantity', headerName: 'Result Qty', width: 120},
        {field: 'reason', headerName: 'Reason', flex: 1}
    ];

    // CRUD handlers
    const handleSaveItem = async () => {
        setActionLoading(true);
        setError(null);
        try {
            if (editingItem) {
                const res = await apiClient.put(`/inventory/items/${editingItem.id}`, itemForm);
                setItems(prev => prev.map(i => i.id === editingItem.id ? res.data : i));
            } else {
                const res = await apiClient.post('/inventory/items', itemForm);
                setItems(prev => [...prev, res.data]);
            }
            setItemDialogOpen(false);
            setEditingItem(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setActionLoading(false);
        }
    };
    const handleDeleteItem = async (id: string) => {
        setActionLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/inventory/items/${id}`);
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveCategory = async () => {
        setActionLoading(true);
        setError(null);
        try {
            if (editingCategory) {
                const res = await apiClient.put(`/inventory/categories/${editingCategory.id}`, categoryForm);
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? res.data : c));
            } else {
                const res = await apiClient.post('/inventory/categories', categoryForm);
                setCategories(prev => [...prev, res.data]);
            }
            setCategoryDialogOpen(false);
            setEditingCategory(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setActionLoading(false);
        }
    };
    const handleDeleteCategory = async (id: string) => {
        setActionLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/inventory/categories/${id}`);
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveLocation = async () => {
        setActionLoading(true);
        setError(null);
        try {
            if (editingLocation) {
                const res = await apiClient.put(`/inventory/locations/${editingLocation.id}`, locationForm);
                setLocations(prev => prev.map(l => l.id === editingLocation.id ? res.data : l));
            } else {
                const res = await apiClient.post('/inventory/locations', locationForm);
                setLocations(prev => [...prev, res.data]);
            }
            setLocationDialogOpen(false);
            setEditingLocation(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setActionLoading(false);
        }
    };
    const handleDeleteLocation = async (id: string) => {
        setActionLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/inventory/locations/${id}`);
            setLocations(prev => prev.filter(l => l.id !== id));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveMovement = async () => {
        if (!movementItem) return;
        setActionLoading(true);
        setError(null);
        try {
            const payload = {itemId: movementItem.id, delta: movementForm.delta, reason: movementForm.reason};
            const res = await apiClient.post('/inventory/movements', payload);
            setMovements(prev => [res.data, ...prev]);
            // update item quantity (mock backend already did, but update local state to reflect new number/order)
            setItems(prev => prev.map(i => i.id === movementItem.id ? {
                ...i,
                quantity: res.data.resultingQuantity
            } : i));
            setMovementDialogOpen(false);
            setMovementItem(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Movement failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Box maxWidth={1400} mx="auto" px={{xs: 1, sm: 2, md: 3}}>
            <Typography variant="h5" fontWeight={600} gutterBottom>{heading}</Typography>
            <Paper elevation={0} variant="outlined" sx={{p: 1.5, borderRadius: 2}}>
                <Tabs value={tab} onChange={changeTab} variant="scrollable" allowScrollButtonsMobile sx={{
                    '& .MuiTab-root': {textTransform: 'none', fontWeight: 500, minHeight: 44},
                    '& .MuiTabs-indicator': {height: 3}
                }}>
                    <Tab label="Dashboard" value="dashboard"/>
                    <Tab label="Items" value="items"/>
                    <Tab label="Categories" value="categories"/>
                    <Tab label="Locations" value="locations"/>
                    <Tab label="Movements" value="movements"/>
                </Tabs>
                <Divider sx={{mb: 2}}/>
                {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}
                {loading &&
                    <Box display="flex" alignItems="center" gap={1} mb={2}><CircularProgress size={20}/><Typography
                        variant="caption" color="text.secondary">Loading…</Typography></Box>}
                <TabPanel active={tab} me="dashboard">
                    <Stack spacing={2}>
                        <Typography variant="body1" fontWeight={500}>Overview</Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                            <Paper variant="outlined" sx={{p: 1.5, minWidth: 180}}><Typography variant="caption"
                                                                                               color="text.secondary">Items</Typography><Typography
                                variant="h6">{totalItems}</Typography></Paper>
                            <Paper variant="outlined" sx={{p: 1.5, minWidth: 180}}><Typography variant="caption"
                                                                                               color="text.secondary">Total
                                Quantity</Typography><Typography variant="h6">{totalQuantity}</Typography></Paper>
                            <Paper variant="outlined" sx={{p: 1.5, minWidth: 180}}><Typography variant="caption"
                                                                                               color="text.secondary">Low
                                Stock</Typography><Typography variant="h6">{lowStock}</Typography></Paper>
                            <Paper variant="outlined" sx={{p: 1.5, minWidth: 180}}><Typography variant="caption"
                                                                                               color="text.secondary">Categories</Typography><Typography
                                variant="h6">{totalCategories}</Typography></Paper>
                        </Stack>
                        <Paper variant="outlined" sx={{p: 2}}>
                            <Typography variant="subtitle2" gutterBottom>Recently Updated Items</Typography>
                            <Stack spacing={1}>
                                {items.slice(0, 5).map(it => (
                                    <Box key={it.id} display="flex" alignItems="center" gap={1}>
                                        <Inventory2OutlinedIcon fontSize="small"/>
                                        <Typography variant="body2" flexGrow={1}>{it.name}</Typography>
                                        {it.reorderLevel !== undefined && it.quantity <= (it.reorderLevel || 0) &&
                                            <Chip size="small" color="warning" label="Low"/>}
                                        <Typography variant="caption" color="text.secondary">{it.quantity}</Typography>
                                    </Box>
                                ))}
                                {items.length === 0 &&
                                    <Typography variant="caption" color="text.secondary">No items</Typography>}
                            </Stack>
                        </Paper>
                    </Stack>
                </TabPanel>
                <TabPanel active={tab} me="items">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2" color="text.secondary">Inventory items</Typography>
                        <Button size="small" startIcon={<AddIcon/>} variant="contained" onClick={() => {
                            setEditingItem(null);
                            setItemForm({
                                sku: '',
                                name: '',
                                categoryId: categories[0]?.id || '',
                                locationId: locations[0]?.id || '',
                                quantity: 0,
                                reorderLevel: 0,
                                description: ''
                            });
                            setItemDialogOpen(true);
                        }}>New Item</Button>
                    </Stack>
                    <div style={{width: '100%'}}>
                        <DataGrid rows={items} columns={itemColumns} disableRowSelectionOnClick
                                  paginationModel={{pageSize: 10, page: 0}} pageSizeOptions={[10, 20, 50]}/>
                    </div>
                </TabPanel>
                <TabPanel active={tab} me="categories">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2" color="text.secondary">Categories</Typography>
                        <Button size="small" startIcon={<AddIcon/>} variant="contained" onClick={() => {
                            setEditingCategory(null);
                            setCategoryForm({name: '', description: ''});
                            setCategoryDialogOpen(true);
                        }}>New Category</Button>
                    </Stack>
                    <div style={{width: '100%'}}>
                        <DataGrid rows={categories} columns={categoryColumns} disableRowSelectionOnClick
                                  paginationModel={{pageSize: 10, page: 0}} pageSizeOptions={[10, 20]}/>
                    </div>
                </TabPanel>
                <TabPanel active={tab} me="locations">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2" color="text.secondary">Locations</Typography>
                        <Button size="small" startIcon={<AddIcon/>} variant="contained" onClick={() => {
                            setEditingLocation(null);
                            setLocationForm({name: '', description: ''});
                            setLocationDialogOpen(true);
                        }}>New Location</Button>
                    </Stack>
                    <div style={{width: '100%'}}>
                        <DataGrid rows={locations} columns={locationColumns} disableRowSelectionOnClick
                                  paginationModel={{pageSize: 10, page: 0}} pageSizeOptions={[10, 20]}/>
                    </div>
                </TabPanel>
                <TabPanel active={tab} me="movements">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2" color="text.secondary">Stock movements</Typography>
                        <Button size="small" startIcon={<AddIcon/>} variant="contained" disabled={items.length === 0}
                                onClick={() => {
                                    const it = items[0];
                                    setMovementItem(it);
                                    setMovementForm({delta: 0, reason: ''});
                                    setMovementDialogOpen(true);
                                }}>New Movement</Button>
                    </Stack>
                    <div style={{width: '100%'}}>
                        <DataGrid rows={movements} columns={movementColumns} disableRowSelectionOnClick
                                  paginationModel={{pageSize: 10, page: 0}} pageSizeOptions={[10, 20, 50]}/>
                    </div>
                </TabPanel>
            </Paper>
            {/* Item Dialog */}
            <Dialog open={itemDialogOpen}
                    onClose={() => !actionLoading && (setItemDialogOpen(false), setEditingItem(null))} fullWidth
                    maxWidth="sm">
                <DialogTitle>{editingItem ? 'Edit Item' : 'New Item'}</DialogTitle>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                    <TextField label="SKU" value={itemForm.sku}
                               onChange={e => setItemForm(f => ({...f, sku: e.target.value}))} fullWidth/>
                    <TextField label="Name" value={itemForm.name}
                               onChange={e => setItemForm(f => ({...f, name: e.target.value}))} fullWidth/>
                    <TextField label="Category Id" value={itemForm.categoryId}
                               onChange={e => setItemForm(f => ({...f, categoryId: e.target.value}))} fullWidth/>
                    <TextField label="Location Id" value={itemForm.locationId}
                               onChange={e => setItemForm(f => ({...f, locationId: e.target.value}))} fullWidth/>
                    <TextField label="Quantity" type="number" value={itemForm.quantity}
                               onChange={e => setItemForm(f => ({...f, quantity: Number(e.target.value) || 0}))}
                               fullWidth/>
                    <TextField label="Reorder Level" type="number" value={itemForm.reorderLevel}
                               onChange={e => setItemForm(f => ({...f, reorderLevel: Number(e.target.value) || 0}))}
                               fullWidth/>
                    <TextField label="Description" value={itemForm.description}
                               onChange={e => setItemForm(f => ({...f, description: e.target.value}))} fullWidth
                               multiline minRows={2}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setItemDialogOpen(false);
                        setEditingItem(null);
                    }} disabled={actionLoading}>Cancel</Button>
                    <Button variant="contained" disabled={actionLoading || !itemForm.name}
                            onClick={handleSaveItem}>{editingItem ? 'Save' : 'Create'}</Button>
                </DialogActions>
            </Dialog>
            {/* Category Dialog */}
            <Dialog open={categoryDialogOpen}
                    onClose={() => !actionLoading && (setCategoryDialogOpen(false), setEditingCategory(null))} fullWidth
                    maxWidth="sm">
                <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                    <TextField label="Name" value={categoryForm.name}
                               onChange={e => setCategoryForm(f => ({...f, name: e.target.value}))} fullWidth/>
                    <TextField label="Description" value={categoryForm.description}
                               onChange={e => setCategoryForm(f => ({...f, description: e.target.value}))} fullWidth
                               multiline minRows={2}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setCategoryDialogOpen(false);
                        setEditingCategory(null);
                    }} disabled={actionLoading}>Cancel</Button>
                    <Button variant="contained" disabled={actionLoading || !categoryForm.name}
                            onClick={handleSaveCategory}>{editingCategory ? 'Save' : 'Create'}</Button>
                </DialogActions>
            </Dialog>
            {/* Location Dialog */}
            <Dialog open={locationDialogOpen}
                    onClose={() => !actionLoading && (setLocationDialogOpen(false), setEditingLocation(null))} fullWidth
                    maxWidth="sm">
                <DialogTitle>{editingLocation ? 'Edit Location' : 'New Location'}</DialogTitle>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                    <TextField label="Name" value={locationForm.name}
                               onChange={e => setLocationForm(f => ({...f, name: e.target.value}))} fullWidth/>
                    <TextField label="Description" value={locationForm.description}
                               onChange={e => setLocationForm(f => ({...f, description: e.target.value}))} fullWidth
                               multiline minRows={2}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setLocationDialogOpen(false);
                        setEditingLocation(null);
                    }} disabled={actionLoading}>Cancel</Button>
                    <Button variant="contained" disabled={actionLoading || !locationForm.name}
                            onClick={handleSaveLocation}>{editingLocation ? 'Save' : 'Create'}</Button>
                </DialogActions>
            </Dialog>
            {/* Movement Dialog */}
            <Dialog open={movementDialogOpen}
                    onClose={() => !actionLoading && (setMovementDialogOpen(false), setMovementItem(null))} fullWidth
                    maxWidth="sm">
                <DialogTitle>{movementItem ? `Adjust: ${movementItem.name}` : 'New Movement'}</DialogTitle>
                <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                    <TextField label="Delta (use negative for removal)" type="number" value={movementForm.delta}
                               onChange={e => setMovementForm(f => ({...f, delta: Number(e.target.value) || 0}))}
                               fullWidth/>
                    <TextField label="Reason" value={movementForm.reason}
                               onChange={e => setMovementForm(f => ({...f, reason: e.target.value}))} fullWidth
                               multiline minRows={2}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setMovementDialogOpen(false);
                        setMovementItem(null);
                    }} disabled={actionLoading}>Cancel</Button>
                    <Button variant="contained" disabled={actionLoading || !movementItem || movementForm.delta === 0}
                            onClick={handleSaveMovement}>Apply</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}