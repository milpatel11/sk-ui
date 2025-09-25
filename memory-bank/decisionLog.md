# Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-09-24 | Use Next.js App Router for docs/playground | Co-locate examples with pages, fast dev via Turbopack, easy deploy |
| 2025-09-24 | Base UI as primitive layer | Leverage accessible, unstyled primitives to accelerate development while keeping styling free |
| 2025-09-24 | Theme via CSS variables | Framework-agnostic theming, supports dark mode and runtime toggles |
| 2025-09-24 | Styling-agnostic components | Consumers can bring their own CSS systems; reduces lock-in |
| 2025-09-24 | React 19 + TypeScript 5 | Latest stable for modern features and types |
