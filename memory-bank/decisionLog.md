# Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-10-24 | Use client-side localStorage for tokens/expiry with pre-expiry refresh prompt | Keep implementation simple without backend SSR session dependency; explicit UX for expiry |
| 2025-10-24 | Enforce tenant lock via `ProtectedLayout` routing guard | Ensure users stay within their active tenant and avoid cross-tenant leakage |
| 2025-10-24 | Adopt MUI 7 with Next.js v15 app router cache provider | Leverage MUI components and SSR compatibility |
| 2025-10-24 | Auto-generate breadcrumbs from URL for tenant routes | Reduce manual wiring and ensure consistent navigational context |
| 2025-10-25 | Remove 'Tenant Management' as a separate app; keep 'Admin' only, and add 'Market' app section to Reporting with tabs (Events, Hashtags & Trends, News). | Tenant Management duplicated Admin functionality. Reporting needs a Market analytics section; we added a Market app tab with inner tabs for Events, Social Trends, and News. |
