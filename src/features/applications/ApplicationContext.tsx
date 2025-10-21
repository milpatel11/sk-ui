"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Application } from '@/lib/types';
import { useTenants } from '@/features/tenants/TenantContext';

interface ApplicationContextValue {
  applications: Application[];
  loading: boolean;
}

const ApplicationContext = createContext<ApplicationContextValue | undefined>(undefined);

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTenantId } = useTenants();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!activeTenantId) return;
    (async () => {
      setLoading(true);
      try {
        const resp = await apiClient.get('/applications');
        if (mounted) setApplications(resp.data);
      } catch {
        // TODO toast
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [activeTenantId]);

  return (
    <ApplicationContext.Provider value={{ applications, loading }}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplications = () => {
  const ctx = useContext(ApplicationContext);
  if (!ctx) throw new Error('useApplications must be used within ApplicationProvider');
  return ctx;
};