"use client";
import React, {createContext, useContext, useEffect, useState} from 'react';
import {apiClient} from '@/lib/apiClient';
import {Tenant} from '@/lib/types';
import {useAuth} from '@/features/auth/AuthContext';

interface TenantContextValue {
    tenants: Tenant[];
    activeTenantId: string | null;
    setActiveTenantId: (id: string) => void;
    loading: boolean;
    addTenant: (t: Tenant) => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const {ready: authReady, isAuthenticated} = useAuth();

    useEffect(() => {
        if (!authReady || !isAuthenticated) return; // only fetch when authenticated
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const resp = await apiClient.get('/tenants');
                if (!mounted) return;
                const raw = Array.isArray(resp.data) ? resp.data : [];
                const normalized: Tenant[] = raw.map((t: any) => ({
                    tenant_id: t.tenant_id ?? t.tenantId ?? t.id,
                    tenant_name: t.tenant_name ?? t.tenantName ?? t.name,
                    tenant_description: t.tenant_description ?? t.tenantDescription ?? t.description ?? null,
                    created_at: t.created_at ?? t.createdAt ?? undefined,
                    billing_address_line1: t.billing_address_line1 ?? t.billingAddressLine1 ?? undefined,
                    billing_address_line2: t.billing_address_line2 ?? t.billingAddressLine2 ?? undefined,
                    billing_city: t.billing_city ?? t.billingCity ?? undefined,
                    billing_state: t.billing_state ?? t.billingState ?? undefined,
                    billing_postal_code: t.billing_postal_code ?? t.billingPostalCode ?? undefined,
                    billing_country: t.billing_country ?? t.billingCountry ?? undefined,
                    shipping_address_line1: t.shipping_address_line1 ?? t.shippingAddressLine1 ?? undefined,
                    shipping_address_line2: t.shipping_address_line2 ?? t.shippingAddressLine2 ?? undefined,
                    shipping_city: t.shipping_city ?? t.shippingCity ?? undefined,
                    shipping_state: t.shipping_state ?? t.shippingState ?? undefined,
                    shipping_postal_code: t.shipping_postal_code ?? t.shippingPostalCode ?? undefined,
                    shipping_country: t.shipping_country ?? t.shippingCountry ?? undefined,
                })).filter((x: Tenant) => !!x.tenant_id && !!x.tenant_name);
                setTenants(normalized);
                const stored = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
                if (stored && normalized.find((t: Tenant) => t.tenant_id === stored)) {
                    setActiveTenantId(stored);
                } else if (normalized.length) {
                    setActiveTenantId(normalized[0].tenant_id);
                }
            } catch {
                // ignore errors here (e.g., 401) and let AuthContext handle redirects
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [authReady, isAuthenticated]);

    const change = (id: string) => {
        setActiveTenantId(id);
        if (typeof window !== 'undefined') localStorage.setItem('tenantId', id);
    };

    const addTenant = (t: Tenant) => {
        setTenants(prev => [...prev, t]);
        change(t.tenant_id);
    };

    return (
        <TenantContext.Provider value={{tenants, activeTenantId, setActiveTenantId: change, loading, addTenant}}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenants = () => {
    const ctx = useContext(TenantContext);
    if (!ctx) throw new Error('useTenants must be used within TenantProvider');
    return ctx;
};