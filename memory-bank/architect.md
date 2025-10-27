# System Architecture

## Overview
Identity Suite is a Next.js (App Router) application with a protected shell for tenant-scoped features. Auth and Tenant contexts coordinate to enforce tenant locking and provide seamless navigation.

## Architectural Decisions

- Homepage no longer redirects to /login; it now serves a marketing-style landing.
- Inquiry submissions handled by a simple Next.js route handler (/api/inquiry) with basic validation; future: wire to email/CRM.



- Finance categorization rules are created/edited in UI; auto-application during save/import is not yet implemented.
- Client-side CSV/JSON export used for accounts and journal; import uploads raw file content to backend for parsing.
- Projection uses a simple +1% monthly heuristic over current USD balances and a Mermaid sequence diagram to visualize income vs expenses.



1. App Router with client providers: `AuthProvider`, `TenantProvider` wrap the app in `src/app/layout.tsx` for global context availability.
2. Token handling on the client: tokens and expiry stored in localStorage; session refresh UI appears before expiry; automatic logout on expiry.
3. Tenant lock-in: First valid tenant becomes active; route guard in `ProtectedLayout` keeps the user under `/tenant/[tenantId]` paths and redirects when needed.
4. MUI 7 for UI system: Using `@mui/material` with `@mui/material-nextjs` cache provider for SSR compatibility.
5. Breadcrumbs auto-generation: For tenant routes, breadcrumbs derive from URL segments with tenant display name.

## Components

### FinanceTabPage

Next.js App Router page providing the finance workbench with tabs: journal, assets, liabilities, vendors, rules, import, export, projections.

**Responsibilities:**

- Route-driven tab navigation and validation.
- CRUD for accounts (assets/liabilities), vendors, and categorization rules.
- Journal entry creation/editing with validation and multiple lines.
- File import (CSV/JSON) preview and POST to backend; export accounts/journal client-side CSV/JSON.
- Projection cards and minimal inline bar chart; Mermaid sequence diagram aggregation by monthly/quarterly/annually.





- `AuthProvider`: manages session, expiry, refresh dialog, and provides `isAuthenticated` + `ready` flags.
- `TenantProvider`: loads tenants post-auth, maintains `activeTenantId`, persists to localStorage.
- `ProtectedLayout`: top AppBar, logout, and breadcrumb generation; enforces tenant lock.
- `RootLayout`: font setup, CSS baseline, wraps providers.



## Design Considerations

- Kept UI consistent with MUI; avoided Grid2 dependency issues by using Stack/Box layout.
- Kept landing static for fast load; form posts JSON; graceful success/error messaging.



- Currency validation is strict (3-letter codes).
- Journal entries must be balanced and non-zero; each line must have exactly a debit or a credit.
- Mermaid is loaded dynamically and may fail gracefully; keep diagram complexity limited for reliability.

