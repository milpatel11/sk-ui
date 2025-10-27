// Simple in-memory mock data & handlers
import {
    Application,
    ApplicationUser,
    CalendarEvent,
    ChatMessage,
    ChatThread,
    GlobalUser,
    Group,
    GroupRole,
    InventoryCategory,
    InventoryItem,
    InventoryLocation,
    InventoryMovement,
    PasswordResetRequest,
    Permission,
    Role,
    RolePermission,
    Tenant,
    UserGroup
} from './types';

// Track a very naive current session user id for /me endpoint support
let currentUserId: string | null = 'user-1';

const tenants: Tenant[] = [
    {
        tenant_id: 't-1',
        tenant_name: 'Acme Corp',
        tenant_description: 'Primary demo tenant',
        created_at: new Date().toISOString()
    },
    {
        tenant_id: 't-2',
        tenant_name: 'Globex',
        tenant_description: 'Secondary tenant',
        created_at: new Date().toISOString()
    }
];

const applications: Application[] = [
    {
        application_id: 'app-1',
        name: 'User Portal',
        description: 'End user portal',
        host: '/user-management/notifications'
    },
    {application_id: 'admin', name: 'Admin Console', description: 'Administration console', host: '/admin'},
    {
        application_id: 'tms',
        name: 'Task Management',
        description: 'Track and manage tasks',
        host: '/task-management'
    },
    {
        application_id: 'inventory',
        name: 'Inventory Management',
        description: 'Stock, categories, locations, movements',
        host: '/inventory-management'
    },
    {
        application_id: 'finance',
        name: 'Financial Operations Suite',
        description: 'POS, invoices, statements, AR/AP management',
        host: '/finance'
    },
    // { application_id: 'tax', name: 'Tax Management', description: 'Jurisdictions, categories, rules, transactions', host: '/tax-management' },
    {
        application_id: 'itdn',
        name: 'Integrated Transportation & Delivery Network (ITDN)',
        description: 'Unified ride-hailing, courier, food & grocery delivery logistics platform',
        host: '/itdn/shuttle'
    },
    {
        application_id: 'hr',
        name: 'Human Resources',
        description: 'Attendance, shifts, vacations, availability',
        host: '/human-resources'
    },
    // Added applications
    {
        application_id: 'reporting',
        name: 'Reporting Engine',
        description: 'Dashboards and reporting',
        host: '/reporting'
    },
    {
        application_id: 'crm',
        name: 'CRM',
        description: 'Customer Relationship Management',
        host: '/crm'
    },
    // Removed duplicate Tenant Management app (Admin covers these capabilities)
];

const permissions: Permission[] = [
    {permission_id: 'perm-1', name: 'users.read', description: 'Read users'},
    {permission_id: 'perm-2', name: 'users.create', description: 'Create users'},
    {permission_id: 'perm-3', name: 'users.update', description: 'Update users'},
    {permission_id: 'perm-4', name: 'users.disable', description: 'Disable users'}
];

const roles: Role[] = [
    {role_id: 'role-1', name: 'Admin', scope: 'TENANT'},
    {role_id: 'role-2', name: 'Viewer', scope: 'TENANT'},
    {role_id: 'role-3', name: 'AppManager', scope: 'APPLICATION'},
    {role_id: 'role-4', name: 'AppReader', scope: 'APPLICATION'}
];

// Pre-seeded global groups for demo (15 items)
const groups: Group[] = Array.from({length: 15}).map((_, idx) => ({
    group_id: `group-${idx + 1}`,
    group_name: `Group ${idx + 1}`,
    group_description: `Sample description for group ${idx + 1}`,
    tenant_id: idx % 2 === 0 ? 't-1' : 't-2'
}));

const users: GlobalUser[] = Array.from({length: 32}).map((_, i) => ({
    user_id: `user-${i + 1}`,
    first_name: `First${i + 1}`,
    last_name: `Last${i + 1}`,
    email: `user${i + 1}@example.com`,
    username: `user${i + 1}`,
    tenant_id: i % 2 === 0 ? 't-1' : 't-2',
    last_login: new Date(Date.now() - i * 3600_000).toISOString(),
    enabled: i % 5 !== 0,
    password: 'pass' + (i + 1),
}));

// Application user mappings (user membership in applications + application-scoped roles)
const applicationUsers: ApplicationUser[] = [
    {application_id: 'ims', user_id: 'user-1', role_ids: ['role-3']},
    {application_id: 'ims', user_id: 'user-2', role_ids: ['role-4']},
    {application_id: 'app-1', user_id: 'user-3', role_ids: ['role-4']}
];

// Relationship edges
const userGroups: UserGroup[] = [
    {user_id: 'user-1', group_id: 'group-1'},
    {user_id: 'user-2', group_id: 'group-2'},
    {user_id: 'user-3', group_id: 'group-2'}
];

const groupRoles: GroupRole[] = [
    {group_id: 'group-1', role_id: 'role-1'}, // Ops -> Admin (tenant)
    {group_id: 'group-2', role_id: 'role-2'}, // Dev -> Viewer (tenant)
    {group_id: 'group-2', role_id: 'role-3'}  // Dev -> AppManager (application)
];

const rolePermissions: RolePermission[] = [
    {role_id: 'role-1', permission_id: 'perm-1'},
    {role_id: 'role-1', permission_id: 'perm-2'},
    {role_id: 'role-1', permission_id: 'perm-3'},
    {role_id: 'role-1', permission_id: 'perm-4'},
    {role_id: 'role-2', permission_id: 'perm-1'},
    {role_id: 'role-3', permission_id: 'perm-1'},
    {role_id: 'role-3', permission_id: 'perm-2'},
    {role_id: 'role-4', permission_id: 'perm-1'}
];

// Pending / approved password reset requests (admin-gated)
const passwordResetRequests: PasswordResetRequest[] = [];

// --- Chat mock data ---
const chatThreads: ChatThread[] = [
    {
        thread_id: 'th-1',
        type: 'DIRECT',
        participant_user_ids: ['user-1', 'user-2'],
        last_message_at: new Date(Date.now() - 120000).toISOString(),
        last_message_preview: 'Let\'s sync later'
    },
    {
        thread_id: 'th-2',
        type: 'GROUP',
        participant_user_ids: users.slice(0, 5).map(u => u.user_id),
        group_id: 'group-1',
        last_message_at: new Date(Date.now() - 300000).toISOString(),
        last_message_preview: 'Updated deployment is live'
    }
];
const chatMessages: ChatMessage[] = [
    {
        message_id: 'msg-1',
        thread_id: 'th-1',
        sender_user_id: 'user-1',
        body: 'Hey there',
        created_at: new Date(Date.now() - 600000).toISOString()
    },
    {
        message_id: 'msg-2',
        thread_id: 'th-1',
        sender_user_id: 'user-2',
        body: 'Let\'s sync later',
        created_at: new Date(Date.now() - 120000).toISOString()
    },
    {
        message_id: 'msg-3',
        thread_id: 'th-2',
        sender_user_id: 'user-3',
        body: 'Updated deployment is live',
        created_at: new Date(Date.now() - 300000).toISOString()
    }
];

// --- Calendar events (mock) ---
const calendarEvents: CalendarEvent[] = [
    {
        id: 'cal-1',
        title: 'Project Kickoff',
        start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        end: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
        color: '#1976d2'
    },
    {
        id: 'cal-2',
        title: 'Lunch',
        start: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
        end: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
        color: '#9c27b0'
    }
];

const invitations: any[] = [
    {
        invitation_id: 'inv-1',
        tenant_id: tenants[0].tenant_id,
        tenant_name: tenants[0].tenant_name,
        invited_username: 'user1',
        role_names: ['Viewer'],
        status: 'PENDING',
        created_at: new Date().toISOString(),
        expires_at: null,
    },
    {
        invitation_id: 'inv-2',
        tenant_id: tenants[1].tenant_id,
        tenant_name: tenants[1].tenant_name,
        invited_username: 'user2',
        role_names: ['Admin'],
        status: 'PENDING',
        created_at: new Date().toISOString(),
        expires_at: null,
    }
];

const tenantInvitations: any[] = [];

const tenantJoinRequests: any[] = [];

// --- TMS (Task Management System) mock domain ---
interface MockTask {
    id: string;
    typeKey: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    reporterId?: string;
    assigneeId?: string;
    slaPolicyId?: string;
    workflowInstanceId?: string;
    dueDate?: string;
    metadata?: any;
    createdAt?: string;
    updatedAt?: string;
}

const tmsTasks: MockTask[] = Array.from({length: 6}).map((_, i) => ({
    id: `task-${i + 1}`,
    typeKey: i % 2 === 0 ? 'issue' : 'request',
    title: `Sample Task ${i + 1}`,
    description: 'Demo task placeholder',
    status: ['open', 'in_progress', 'done'][i % 3],
    priority: ['low', 'medium', 'high'][i % 3],
    reporterId: 'user-1',
    assigneeId: i % 2 === 0 ? 'user-2' : 'user-3',
    slaPolicyId: i % 2 === 0 ? 'sla-1' : 'sla-2',
    workflowInstanceId: `wfi-${(i % 3) + 1}`,
    dueDate: new Date(Date.now() + (i + 1) * 86400_000).toISOString(),
    metadata: {sample: true},
    createdAt: new Date(Date.now() - (i + 1) * 3600_000).toISOString(),
    updatedAt: new Date().toISOString()
}));

interface MockWorkflow {
    id: string;
    name: string;
    description?: string;
    definition?: any;
    createdAt?: string;
}

const tmsWorkflows: MockWorkflow[] = [
    {
        id: 'wf-1',
        name: 'Default Issue Flow',
        description: 'Basic issue workflow',
        definition: {states: ['open', 'in_progress', 'done']},
        createdAt: new Date().toISOString()
    },
    {
        id: 'wf-2',
        name: 'Request Flow',
        description: 'Request approval workflow',
        definition: {states: ['open', 'approval', 'fulfilled']},
        createdAt: new Date().toISOString()
    }
];

// Workflow states & transitions
interface MockWorkflowState { id: string; workflowId: string; key: string; name: string; metadata?: any; createdAt?: string; updatedAt?: string }
interface MockWorkflowTransition { id: string; workflowId: string; name: string; fromStateId: string; toStateId: string; conditions?: any; actions?: any; metadata?: any; createdAt?: string; updatedAt?: string }

const tmsWorkflowStates: MockWorkflowState[] = [
    { id: 'wfs-1', workflowId: 'wf-1', key: 'open', name: 'Open', createdAt: new Date().toISOString() },
    { id: 'wfs-2', workflowId: 'wf-1', key: 'in_progress', name: 'In Progress', createdAt: new Date().toISOString() },
    { id: 'wfs-3', workflowId: 'wf-1', key: 'done', name: 'Done', createdAt: new Date().toISOString() },
    { id: 'wfs-4', workflowId: 'wf-2', key: 'open', name: 'Open', createdAt: new Date().toISOString() },
    { id: 'wfs-5', workflowId: 'wf-2', key: 'approval', name: 'Approval', createdAt: new Date().toISOString() },
    { id: 'wfs-6', workflowId: 'wf-2', key: 'fulfilled', name: 'Fulfilled', createdAt: new Date().toISOString() }
];

const tmsWorkflowTransitions: MockWorkflowTransition[] = [
    { id: 'wft-1', workflowId: 'wf-1', name: 'Start work', fromStateId: 'wfs-1', toStateId: 'wfs-2', createdAt: new Date().toISOString() },
    { id: 'wft-2', workflowId: 'wf-1', name: 'Complete', fromStateId: 'wfs-2', toStateId: 'wfs-3', createdAt: new Date().toISOString() },
    { id: 'wft-3', workflowId: 'wf-2', name: 'Submit for approval', fromStateId: 'wfs-4', toStateId: 'wfs-5', metadata: { requiresApproval: true }, createdAt: new Date().toISOString() },
    { id: 'wft-4', workflowId: 'wf-2', name: 'Fulfill', fromStateId: 'wfs-5', toStateId: 'wfs-6', createdAt: new Date().toISOString() }
];

// Add missing Workflow Instances mock type and data
interface MockWorkflowInstance {
    id: string;
    workflowId: string;
    currentStateId: string;
    taskId?: string;
    metadata?: any;
    createdAt?: string;
    updatedAt?: string;
}

const tmsWorkflowInstances: MockWorkflowInstance[] = [
    { id: 'wfi-1', workflowId: 'wf-1', currentStateId: 'wfs-1', createdAt: new Date().toISOString() },
    { id: 'wfi-2', workflowId: 'wf-1', currentStateId: 'wfs-2', createdAt: new Date().toISOString() },
    { id: 'wfi-3', workflowId: 'wf-2', currentStateId: 'wfs-4', createdAt: new Date().toISOString() },
];

// SLA Policies and Timers (restored)
interface MockSlaPolicy {
    slaPolicyId: string;
    name: string;
    description?: string;
    durationSeconds: number;
    targetHours?: number;
    createdAt?: string;
}

const tmsSlaPolicies: MockSlaPolicy[] = [
    {
        slaPolicyId: 'sla-1',
        name: 'Standard 48h',
        description: 'Resolution within 48 hours',
        durationSeconds: 172800,
        targetHours: 48,
        createdAt: new Date().toISOString()
    },
    {
        slaPolicyId: 'sla-2',
        name: 'Priority 24h',
        description: 'High priority tasks 24h',
        durationSeconds: 86400,
        targetHours: 24,
        createdAt: new Date().toISOString()
    }
];

interface MockSlaTimer {
    slaTimerId: string;
    taskId: string;
    policyId: string;
    dueAt?: string;
    breached?: boolean;
    startedAt?: string;
    stoppedAt?: string;
}

const tmsSlaTimers: MockSlaTimer[] = [
    {
        slaTimerId: 'slat-1',
        taskId: 'task-1',
        policyId: 'sla-1',
        startedAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + 36 * 3600_000).toISOString(),
        breached: false
    },
    {
        slaTimerId: 'slat-2',
        taskId: 'task-2',
        policyId: 'sla-2',
        startedAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + 12 * 3600_000).toISOString(),
        breached: false
    }
];

// Add Approvals mock domain
interface MockApproval {
    approvalId: string;
    taskId: string;
    sequence: number;
    approverGlobalUserId?: string;
    approverApplicationUserId?: string;
    approverGroupId?: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedBy?: string;
    requestedAt?: string;
    respondedAt?: string;
    responseComment?: string;
    metadata?: any;
}

const tmsApprovals: MockApproval[] = [
    {
        approvalId: 'ap-1',
        taskId: 'task-1',
        sequence: 1,
        approverGlobalUserId: 'user-2',
        status: 'pending',
        requestedBy: 'user-1',
        requestedAt: new Date().toISOString(),
    },
    {
        approvalId: 'ap-2',
        taskId: 'task-2',
        sequence: 1,
        approverGroupId: 'group-1',
        status: 'approved',
        requestedBy: 'user-3',
        requestedAt: new Date(Date.now() - 3600_000).toISOString(),
        respondedAt: new Date().toISOString(),
        responseComment: 'Looks good',
    }
];

// --- API Mock Handlers ---
export const mockGet = async (url: string) => {
    // Simulate latency
    await new Promise(r => setTimeout(r, 150));
    if (url.startsWith('/me')) {
        const me = currentUserId ? users.find(u => u.user_id === currentUserId) : null;
        return {data: me || null};
    }
    if (url.startsWith('/tenants')) return {data: tenants};
    if (url.startsWith('/applications')) return {data: applications};
    if (url.startsWith('/permissions')) return {data: permissions};
    if (url.startsWith('/roles')) return {data: roles};
    if (url.startsWith('/application-users')) return {data: applicationUsers};
    if (url.startsWith('/groups')) return {data: groups};
    if (url.startsWith('/users')) return {data: users};
    if (url.startsWith('/password-reset-requests')) return {data: passwordResetRequests};
    if (url.startsWith('/user/')) { // legacy pattern if needed
        const id = url.split('/').pop();
        return {data: users.find(u => u.user_id === id) || null};
    }
    if (url.startsWith('/users/')) {
        const id = url.split('/').pop();
        return {data: users.find(u => u.user_id === id) || null};
    }
    if (url.startsWith('/user-groups')) return {data: userGroups};
    if (url.startsWith('/group-roles')) return {data: groupRoles};
    if (url.startsWith('/role-permissions')) return {data: rolePermissions};
    if (url.startsWith('/chat/threads')) {
        // Optionally filter by participant via query param later
        return {data: chatThreads.sort((a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || ''))};
    }
    if (url.startsWith('/chat/messages')) {
        const threadId = url.split('?')[0].split('/').pop();
        const list = chatMessages.filter(m => m.thread_id === threadId).sort((a, b) => a.created_at.localeCompare(b.created_at));
        return {data: list};
    }
    if (url.startsWith('/calendar/events')) {
        // optional query params: from=iso&to=iso
        let list = [...calendarEvents];
        try {
            const q = new URLSearchParams(url.split('?')[1]);
            const from = q.get('from');
            const to = q.get('to');
            if (from) list = list.filter(ev => ev.end >= from);
            if (to) list = list.filter(ev => ev.start <= to);
        } catch {
        }
        list.sort((a, b) => a.start.localeCompare(b.start));
        return {data: list};
    }
    if (url.startsWith('/invitations')) {
        const currentUser = users.find(u => u.user_id === currentUserId);
        const uname = currentUser?.username;
        const list = invitations.filter(inv => inv.status === 'PENDING' && (inv.invited_username === uname));
        return {data: list};
    }
    if (url.startsWith('/tenant-search')) {
        let q = '';
        try {
            q = new URLSearchParams(url.split('?')[1]).get('q') || '';
        } catch {
        }
        const data = tenants.filter(t => t.tenant_name.toLowerCase().includes(q.toLowerCase()));
        return {data};
    }
    if (url.startsWith('/tenant-join-requests')) {
        const currentUser = users.find(u => u.user_id === currentUserId);
        const uname = currentUser?.username;
        return {data: tenantJoinRequests.filter(r => r.username === uname)};
    }
    if (url.startsWith('/tenant-invitations')) {
        let tId: string | null = null;
        try {
            tId = new URLSearchParams(url.split('?')[1]).get('tenantId');
        } catch {
        }
        const list = tenantInvitations.filter(inv => !tId || inv.tenant_id === tId);
        return {data: list};
    }
    // TMS handlers moved below with detailed routing
    // TMS GET endpoints
    if (url.startsWith('/tms/tasks/')) {
        const id = url.split('/')[3];
        const t = tmsTasks.find(x => x.id === id) || null;
        return {data: t};
    }
    if (url.startsWith('/tms/tasks')) {
        let list = [...tmsTasks];
        try {
            const q = new URLSearchParams(url.split('?')[1] || '');
            const status = q.get('status');
            const assigneeId = q.get('assigneeId');
            const typeKey = q.get('typeKey');
            const workflowInstanceId = q.get('workflowInstanceId');
            if (status) list = list.filter(t => (t.status || '') === status);
            if (assigneeId) list = list.filter(t => (t.assigneeId || '') === assigneeId);
            if (typeKey) list = list.filter(t => (t.typeKey || '') === typeKey);
            if (workflowInstanceId) list = list.filter(t => (t.workflowInstanceId || '') === workflowInstanceId);
        } catch {}
        // optional sort by updatedAt desc
        list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
        return {data: list};
    }
    if (url.startsWith('/tms/approvals')) {
        let list = [...tmsApprovals];
        try {
            const q = new URLSearchParams(url.split('?')[1] || '');
            const taskId = q.get('taskId');
            const status = q.get('status');
            const approverId = q.get('approverId');
            if (taskId) list = list.filter(a => a.taskId === taskId);
            if (status) list = list.filter(a => a.status === (status as any));
            if (approverId) list = list.filter(a => a.approverGlobalUserId === approverId || a.approverApplicationUserId === approverId || a.approverGroupId === approverId);
        } catch {}
        // newest first by requestedAt/ respondedAt
        list.sort((a, b) => (b.respondedAt || b.requestedAt || '').localeCompare(a.respondedAt || a.requestedAt || ''))
        return {data: list};
    }
    if (url.startsWith('/tms/sla-policies/')) {
        const id = url.split('/')[3];
        const p = tmsSlaPolicies.find(x => x.slaPolicyId === id) || null;
        return {data: p};
    }
    if (url.startsWith('/tms/sla-policies')) {
        return {data: tmsSlaPolicies};
    }
    if (url.startsWith('/tms/sla-timers')) {
        let list = [...tmsSlaTimers];
        try {
            const q = new URLSearchParams(url.split('?')[1] || '');
            const taskId = q.get('taskId');
            const policyId = q.get('policyId') || q.get('slaPolicyId');
            const breached = q.get('breached');
            if (taskId) list = list.filter(t => t.taskId === taskId);
            if (policyId) list = list.filter(t => t.policyId === policyId);
            if (breached === 'true' || breached === 'false') list = list.filter(t => String(!!t.breached) === breached);
        } catch {}
        list.sort((a, b) => (a.dueAt || '').localeCompare(b.dueAt || ''))
        return {data: list};
    }
    if (url.startsWith('/tms/workflows/instances')) {
        let list = [...tmsWorkflowInstances];
        try {
            const q = new URLSearchParams(url.split('?')[1] || '');
            const workflowId = q.get('workflowId');
            const taskId = q.get('taskId');
            if (workflowId) list = list.filter(i => i.workflowId === workflowId);
            if (taskId) list = list.filter(i => i.taskId === taskId);
        } catch {}
        return {data: list};
    }
    if (url.startsWith('/tms/workflows/')) {
        const id = url.split('/')[3];
        const w = tmsWorkflows.find(x => x.id === id) || null;
        return {data: w};
    }
    if (url.startsWith('/tms/workflows')) {
        return {data: tmsWorkflows};
    }
    if (url.startsWith('/tms/workflow-states')) {
        let list = [...tmsWorkflowStates];
        try {
            const q = new URLSearchParams(url.split('?')[1] || '');
            const workflowId = q.get('workflowId');
            if (workflowId) list = list.filter(s => s.workflowId === workflowId);
        } catch {}
        return {data: list};
    }
    if (url.startsWith('/tms/workflow-transitions')) {
        let list = [...tmsWorkflowTransitions];
        try {
            const q = new URLSearchParams(url.split('?')[1] || '');
            const workflowId = q.get('workflowId');
            if (workflowId) list = list.filter(s => s.workflowId === workflowId);
        } catch {}
        return {data: list};
    }
    // Finance GET endpoints
    if (url.startsWith('/finance/accounts')) {
        let list = [...financeAccounts];
        try {
            const q = new URLSearchParams(url.split('?')[1] || '');
            const type = q.get('type');
            const tenantId = q.get('tenantId');
            if (type) list = list.filter(a => a.type === (type.toUpperCase() as any));
            if (tenantId) list = list.filter(a => (a.tenantId || tenants[0].tenant_id) === tenantId);
        } catch {}
        list.sort((a,b) => (a.code||'').localeCompare(b.code||'') || a.name.localeCompare(b.name));
        return {data: list};
    }
    if (url.startsWith('/finance/transactions')) {
        let list = [...financeTransactions];
        try {
            const q = new URLSearchParams(url.split('?')[1] || '');
            const tenantId = q.get('tenantId');
            if (tenantId) list = list.filter(t => (t.tenantId || tenants[0].tenant_id) === tenantId);
        } catch {}
        // sort by date desc then id desc
        list.sort((a,b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id));
        return {data: list};
    }
    // Inventory GET endpoints
    if (url.startsWith('/inventory/items')) return {data: inventoryItems};
    if (url.startsWith('/inventory/categories')) return {data: inventoryCategories};
    if (url.startsWith('/inventory/locations')) return {data: inventoryLocations};
    if (url.startsWith('/inventory/movements')) return {data: inventoryMovements.sort((a, b) => b.createdAt.localeCompare(a.createdAt))};
    // POS GET endpoints
    if (url.startsWith('/pos/products')) return {data: posProducts};
    if (url.startsWith('/pos/customers')) return {data: posCustomers};
    if (url.startsWith('/pos/sales')) return {data: posSales.sort((a, b) => b.createdAt.localeCompare(a.createdAt))};
    // Tax Management GET
    if (url.startsWith('/tax/jurisdictions')) return {data: taxJurisdictions};
    if (url.startsWith('/tax/categories')) return {data: taxCategories};
    if (url.startsWith('/tax/rules')) return {data: taxRules};
    if (url.startsWith('/tax/transactions')) return {data: taxTransactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))};
    if (url.startsWith('/itdn/shuttle/stops')) {
        const list = shuttleStops.filter(s => s.hotelId === tenants[0].tenant_id);
        return {data: list};
    }
    if (url.startsWith('/itdn/shuttle/vehicles')) {
        const list = shuttleVehicles.filter(v => v.hotelId === tenants[0].tenant_id);
        return {data: list};
    }
    if (url.startsWith('/itdn/shuttle/bookings')) {
        const list = shuttleBookings.filter(b => b.hotelId === tenants[0].tenant_id);
        return {data: list};
    }
    // HR data (mock)
    if (url.startsWith('/hr/attendance')) return {data: hrAttendance};
    if (url.startsWith('/hr/shifts')) return {data: hrShifts};
    if (url.startsWith('/hr/vacations')) return {data: hrVacations};
    if (url.startsWith('/hr/availability')) return {data: hrAvailability};
    return {data: null};
};

export const mockPost = async (url: string, body: any) => {
    await new Promise(r => setTimeout(r, 150));
    if (url.startsWith('/auth/login')) {
        // Accept username OR email
        const {username, email, password} = body || {};
        const identifier = username || email;
        if (!identifier || !password) throw {status: 400, message: 'Missing credentials'};
        const found = users.find(u => (username && u.username === username) || (email && u.email === email));
        if (!found) throw {status: 401, message: 'Invalid credentials'};
        // In mock we do not verify password strongly
        currentUserId = found.user_id;
        const expiresInSeconds = Math.floor(Date.now() / 1000) + 15 * 60; // 15 min from now (epoch seconds absolute)
        return {
            data: {
                accessToken: 'mock-access-' + currentUserId,
                refreshToken: 'mock-refresh-' + currentUserId,
                expiresInSeconds
            }
        };
    }
    if (url.startsWith('/auth/refresh')) {
        const {refreshToken} = body || {};
        if (!refreshToken) throw {status: 400, message: 'Missing refresh token'};
        // Simply validate pattern
        const uid = typeof refreshToken === 'string' && refreshToken.startsWith('mock-refresh-') ? refreshToken.replace('mock-refresh-', '') : null;
        if (!uid) throw {status: 401, message: 'Invalid refresh token'};
        currentUserId = uid;
        const expiresInSeconds = Math.floor(Date.now() / 1000) + 15 * 60;
        return {
            data: {
                accessToken: 'mock-access-' + currentUserId,
                refreshToken: 'mock-refresh-' + currentUserId,
                expiresInSeconds
            }
        };
    }
    if (url.startsWith('/auth/logout')) {
        currentUserId = null;
        return {data: {success: true}};
    }
    if (url.startsWith('/auth/signup')) {
        // create new user and return session-like response in new auth shape
        const {username, password, email, firstName, lastName, tenantId} = body || {};
        if (!username || !password) throw {status: 400, message: 'Missing required fields'};
        const newUser: GlobalUser = {
            user_id: `user-${users.length + 1}`,
            username,
            email,
            first_name: firstName,
            last_name: lastName,
            tenant_id: tenantId || tenants[0]?.tenant_id,
            enabled: true,
            last_login: null,
        };
        users.push(newUser);
        currentUserId = newUser.user_id;
        const expiresInSeconds = Math.floor(Date.now() / 1000) + 15 * 60;
        return {
            data: {
                accessToken: 'mock-access-' + currentUserId,
                refreshToken: 'mock-refresh-' + currentUserId,
                expiresInSeconds,
                userId: currentUserId
            }
        };
    }
    if (url.startsWith('/tenants')) {
        const newTenant: Tenant = {
            tenant_id: `t-${tenants.length + 1}`,
            tenant_name: body.tenant_name,
            tenant_description: body.tenant_description,
            created_at: new Date().toISOString(),
            billing_address_line1: body.billing_address_line1,
            billing_address_line2: body.billing_address_line2,
            billing_city: body.billing_city,
            billing_state: body.billing_state,
            billing_postal_code: body.billing_postal_code,
            billing_country: body.billing_country,
            shipping_address_line1: body.shipping_address_line1,
            shipping_address_line2: body.shipping_address_line2,
            shipping_city: body.shipping_city,
            shipping_state: body.shipping_state,
            shipping_postal_code: body.shipping_postal_code,
            shipping_country: body.shipping_country,
        };
        tenants.push(newTenant);
        return {data: newTenant};
    }
    if (url.startsWith('/users')) {
        const newUser: GlobalUser = {
            user_id: `user-${users.length + 1}`,
            username: body.username,
            email: body.email,
            first_name: body.first_name,
            last_name: body.last_name,
            tenant_id: body.tenant_id || 't-1',
            enabled: true,
            last_login: null,
        };
        users.push(newUser);
        return {data: newUser};
    }
    if (url.startsWith('/application-users')) {
        // create or update mapping
        const {application_id, user_id, role_ids} = body;
        if (!application_id || !user_id) throw {status: 400, message: 'application_id and user_id required'};
        let entry = applicationUsers.find(a => a.application_id === application_id && a.user_id === user_id);
        if (!entry) {
            entry = {application_id, user_id, role_ids: role_ids || []};
            applicationUsers.push(entry);
        } else if (Array.isArray(role_ids)) {
            entry.role_ids = role_ids;
        }
        return {data: entry};
    }
    if (url.startsWith('/groups')) {
        // create new global group
        const newGroup: Group = {
            group_id: `group-${groups.length + 1}`,
            group_name: body.group_name,
            group_description: body.group_description,
            tenant_id: null
        };
        groups.push(newGroup);
        return {data: newGroup};
    }
    if (url.startsWith('/roles')) {
        // create new role
        const newRole: Role = {
            role_id: `role-${roles.length + 1}`,
            name: body.name,
            scope: body.scope
        };
        roles.push(newRole);
        return {data: newRole};
    }
    if (url.startsWith('/permissions')) {
        const newPerm: Permission = {
            permission_id: `perm-${permissions.length + 1}`,
            name: body.name,
            description: body.description
        };
        permissions.push(newPerm);
        return {data: newPerm};
    }
    if (url.startsWith('/applications')) {
        const newApp: Application = {
            application_id: `app-${applications.length + 1}`,
            name: body.name,
            description: body.description,
            host: body.host || null
        };
        applications.push(newApp);
        return {data: newApp};
    }
    if (url.startsWith('/chat/messages')) {
        const {thread_id, body: messageBody, sender_user_id} = body;
        const tid = thread_id || 'th-new';
        let thread = chatThreads.find(t => t.thread_id === tid);
        if (!thread) {
            thread = {
                thread_id: tid,
                type: 'DIRECT',
                participant_user_ids: [sender_user_id],
                last_message_at: new Date().toISOString(),
                last_message_preview: messageBody
            };
            chatThreads.push(thread);
        }
        const msg: ChatMessage = {
            message_id: 'msg-' + (chatMessages.length + 1),
            thread_id: thread.thread_id,
            sender_user_id,
            body: messageBody,
            created_at: new Date().toISOString()
        };
        chatMessages.push(msg);
        thread.last_message_at = msg.created_at;
        thread.last_message_preview = messageBody;
        return {data: msg};
    }
    if (url.startsWith('/chat/threads')) {
        // create direct or group thread
        const {participant_user_ids, type, group_id} = body;
        const newThread: ChatThread = {
            thread_id: 'th-' + (chatThreads.length + 1),
            type: type || 'DIRECT',
            participant_user_ids: participant_user_ids || [],
            group_id: group_id || null,
            last_message_at: null,
            last_message_preview: null
        };
        chatThreads.push(newThread);
        return {data: newThread};
    }
    if (url.startsWith('/calendar/events')) {
        const {title, start, end, color, description, location} = body;
        if (!title || !start || !end) throw {status: 400, message: 'title, start, end required'};
        const ev: CalendarEvent = {
            id: 'cal-' + (calendarEvents.length + 1),
            title,
            start,
            end,
            color,
            description,
            location
        };
        calendarEvents.push(ev);
        return {data: ev};
    }
    if (url.startsWith('/password-reset-requests')) {
        // create new reset request (PENDING)
        const {user_id} = body;
        if (!user_id) throw {status: 400, message: 'user_id required'};
        const existing = passwordResetRequests.find(r => r.user_id === user_id && r.status === 'PENDING');
        if (existing) return {data: existing};
        const req: PasswordResetRequest = {
            id: 'prr-' + (passwordResetRequests.length + 1),
            user_id,
            created_at: new Date().toISOString(),
            status: 'PENDING'
        };
        passwordResetRequests.push(req);
        return {data: req};
    }
    if (url.startsWith('/invitations/') && url.endsWith('/accept')) {
        const id = url.split('/')[2];
        const inv = invitations.find(i => i.invitation_id === id && i.status === 'PENDING');
        if (!inv) throw {status: 404, message: 'Invitation not found'};
        inv.status = 'ACCEPTED';
        return {data: inv};
    }
    if (url.startsWith('/invitations/') && url.endsWith('/decline')) {
        const id = url.split('/')[2];
        const inv = invitations.find(i => i.invitation_id === id && i.status === 'PENDING');
        if (!inv) throw {status: 404, message: 'Invitation not found'};
        inv.status = 'DECLINED';
        return {data: inv};
    }
    if (url.startsWith('/tenant-join-requests')) {
        const {tenantId} = body || {};
        if (!tenantId) throw {status: 400, message: 'tenantId required'};
        const tenant = tenants.find(t => t.tenant_id === tenantId);
        if (!tenant) throw {status: 404, message: 'Tenant not found'};
        const currentUser = users.find(u => u.user_id === currentUserId);
        const req = {
            request_id: 'tjr-' + (tenantJoinRequests.length + 1),
            tenant_id: tenant.tenant_id,
            tenant_name: tenant.tenant_name,
            created_at: new Date().toISOString(),
            status: 'PENDING',
            username: currentUser?.username,
        };
        tenantJoinRequests.push(req);
        return {data: req};
    }
    if (url.startsWith('/tenant-invitations')) {
        const {tenantId, email, username} = body || {};
        if (!tenantId || (!email && !username)) throw {status: 400, message: 'tenantId and email or username required'};
        const inv = {
            invitation_id: 'tinv-' + (tenantInvitations.length + 1),
            tenant_id: tenantId,
            tenant_name: tenants.find(t => t.tenant_id === tenantId)?.tenant_name || 'Unknown',
            invited_email: email || null,
            invited_username: username || null,
            status: 'PENDING',
            created_at: new Date().toISOString(),
        };
        tenantInvitations.push(inv);
        return {data: inv};
    }
    if (url.startsWith('/tms/tasks')) {
        const newTask = { id: 'task-' + (tmsTasks.length + 1), ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        tmsTasks.push(newTask);
        return {data: newTask};
    }
    if (url.startsWith('/tms/workflows/instances')) {
        const inst = { id: 'wfi-' + (tmsWorkflowInstances.length + 1), ...body, createdAt: new Date().toISOString() };
        tmsWorkflowInstances.push(inst);
        return {data: inst};
    }
    if (url.startsWith('/tms/workflows')) {
        const wf = { id: 'wf-' + (tmsWorkflows.length + 1), ...body, createdAt: new Date().toISOString() };
        tmsWorkflows.push(wf);
        return {data: wf};
    }
    if (url.startsWith('/tms/workflow-states')) {
        const { workflowId, key, name, metadata } = body || {};
        if (!workflowId || !key || !name) throw {status: 400, message: 'workflowId, key, name required'};
        const state = { id: 'wfs-' + (tmsWorkflowStates.length + 1), workflowId, key, name, metadata, createdAt: new Date().toISOString() };
        tmsWorkflowStates.push(state);
        return {data: state};
    }
    if (url.startsWith('/tms/workflow-transitions')) {
        const { workflowId, name, fromStateId, toStateId, conditions, actions, metadata } = body || {};
        if (!workflowId || !name || !fromStateId || !toStateId) throw {status: 400, message: 'workflowId, name, fromStateId, toStateId required'};
        const tr = { id: 'wft-' + (tmsWorkflowTransitions.length + 1), workflowId, name, fromStateId, toStateId, conditions, actions, metadata, createdAt: new Date().toISOString() };
        tmsWorkflowTransitions.push(tr);
        return {data: tr};
    }
    if (url.startsWith('/tms/sla-policies')) {
        const name = body?.name || 'Policy ' + (tmsSlaPolicies.length + 1);
        const targetHours = Number(body?.targetHours) || 24;
        const rec: MockSlaPolicy = {
            slaPolicyId: 'sla-' + (tmsSlaPolicies.length + 1),
            name,
            description: body?.description,
            targetHours,
            durationSeconds: targetHours * 3600,
            createdAt: new Date().toISOString(),
        };
        tmsSlaPolicies.push(rec);
        return {data: rec};
    }
    // Inventory POST
    if (url.startsWith('/inventory/categories')) {
        const nc: InventoryCategory = {
            id: 'cat-' + (inventoryCategories.length + 1),
            name: body.name || 'Category',
            description: body.description || '',
            createdAt: new Date().toISOString()
        };
        inventoryCategories.push(nc);
        return {data: nc};
    }
    if (url.startsWith('/inventory/locations')) {
        const nl: InventoryLocation = {
            id: 'loc-' + (inventoryLocations.length + 1),
            name: body.name || 'Location',
            description: body.description || '',
            createdAt: new Date().toISOString()
        };
        inventoryLocations.push(nl);
        return {data: nl};
    }
    if (url.startsWith('/inventory/items')) {
        const ni: InventoryItem = {
            id: 'inv-' + (inventoryItems.length + 1),
            sku: body.sku || ('SKU-' + (inventoryItems.length + 1)),
            name: body.name || 'Item',
            categoryId: body.categoryId,
            locationId: body.locationId,
            quantity: Number(body.quantity) || 0,
            reorderLevel: body.reorderLevel ? Number(body.reorderLevel) : undefined,
            description: body.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        inventoryItems.push(ni);
        return {data: ni};
    }
    if (url.startsWith('/inventory/movements')) {
        const itemId = body.itemId;
        const delta = Number(body.delta) || 0;
        const item = inventoryItems.find(i => i.id === itemId);
        if (!item) throw {status: 404, message: 'Item not found'};
        item.quantity = item.quantity + delta;
        item.updatedAt = new Date().toISOString();
        const mv: InventoryMovement = {
            id: 'mov-' + (inventoryMovements.length + 1),
            itemId,
            delta,
            reason: body.reason || '',
            createdAt: new Date().toISOString(),
            resultingQuantity: item.quantity
        };
        inventoryMovements.push(mv);
        return {data: mv};
    }
    // Finance POST
    if (url.startsWith('/finance/accounts')) {
        const code: string | undefined = body.code;
        if (code != null && code !== '' && !/^\d+$/.test(String(code))) throw { status: 400, message: 'code must be numeric' };
        const type = (body.type || '').toUpperCase();
        if (type !== 'ASSET' && type !== 'LIABILITY') throw { status: 400, message: 'type must be ASSET or LIABILITY' };
        const currency: string = (body.currency || 'USD').toUpperCase();
        const balCentsRaw = body.balanceCents != null ? Number(body.balanceCents) : null;
        const balanceCents = Number.isFinite(balCentsRaw) ? Math.round(Number(balCentsRaw)) : 0;
        const na: MockFinanceAccount = {
            id: 'fa-' + (financeAccounts.length + 1),
            tenantId: body.tenantId || null,
            type: type as 'ASSET' | 'LIABILITY',
            name: body.name,
            code: code || undefined,
            currency,
            balanceCents,
            description: body.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        financeAccounts.push(na);
        return {data: na};
    }
    if (url.startsWith('/finance/transactions')) {
        const { tenantId, date, currency, reference, memo, lines } = body || {};
        const cur = (currency || 'USD').toUpperCase();
        if (!date) throw { status: 400, message: 'date required' };
        if (!/^[A-Z]{3}$/.test(cur)) throw { status: 400, message: 'currency must be 3-letter code' };
        const arr: any[] = Array.isArray(lines) ? lines : [];
        if (arr.length < 2) throw { status: 400, message: 'need at least 2 lines' };
        let debit = 0, credit = 0;
        for (const l of arr) {
            const acct = financeAccounts.find(a => a.id === l.accountId);
            if (!acct) throw { status: 400, message: 'invalid account in lines' };
            const d = Math.max(0, Math.round(Number(l.debitCents) || 0));
            const c = Math.max(0, Math.round(Number(l.creditCents) || 0));
            if (d > 0 && c > 0) throw { status: 400, message: 'line cannot have both debit and credit' };
            if (d === 0 && c === 0) throw { status: 400, message: 'line must have debit or credit' };
            debit += d; credit += c;
        }
        if (debit !== credit || debit === 0) throw { status: 400, message: 'entry must be balanced and non-zero' };
        const rec: MockFinanceTransaction = {
            id: 'ftx-' + (financeTransactions.length + 1),
            tenantId: tenantId || null,
            date,
            currency: cur,
            reference: reference || '',
            memo: memo || '',
            status: 'POSTED',
            lines: arr.map(l => ({ accountId: l.accountId, description: l.description || '', debitCents: Math.round(Number(l.debitCents) || 0), creditCents: Math.round(Number(l.creditCents) || 0) })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        financeTransactions.push(rec);
        return { data: rec };
    }
    if (url.startsWith('/groups')) {
        // create new global group
        const newGroup: Group = {
            group_id: `group-${groups.length + 1}`,
            group_name: body.group_name,
            group_description: body.group_description,
            tenant_id: null
        };
        groups.push(newGroup);
        return {data: newGroup};
    }
    if (url.startsWith('/roles')) {
        // create new role
        const newRole: Role = {
            role_id: `role-${roles.length + 1}`,
            name: body.name,
            scope: body.scope
        };
        roles.push(newRole);
        return {data: newRole};
    }
    if (url.startsWith('/permissions')) {
        const newPerm: Permission = {
            permission_id: `perm-${permissions.length + 1}`,
            name: body.name,
            description: body.description
        };
        permissions.push(newPerm);
        return {data: newPerm};
    }
    if (url.startsWith('/applications')) {
        const newApp: Application = {
            application_id: `app-${applications.length + 1}`,
            name: body.name,
            description: body.description,
            host: body.host || null
        };
        applications.push(newApp);
        return {data: newApp};
    }
    if (url.startsWith('/chat/messages')) {
        const {thread_id, body: messageBody, sender_user_id} = body;
        const tid = thread_id || 'th-new';
        let thread = chatThreads.find(t => t.thread_id === tid);
        if (!thread) {
            thread = {
                thread_id: tid,
                type: 'DIRECT',
                participant_user_ids: [sender_user_id],
                last_message_at: new Date().toISOString(),
                last_message_preview: messageBody
            };
            chatThreads.push(thread);
        }
        const msg: ChatMessage = {
            message_id: 'msg-' + (chatMessages.length + 1),
            thread_id: thread.thread_id,
            sender_user_id,
            body: messageBody,
            created_at: new Date().toISOString()
        };
        chatMessages.push(msg);
        thread.last_message_at = msg.created_at;
        thread.last_message_preview = messageBody;
        return {data: msg};
    }
    if (url.startsWith('/chat/threads')) {
        // create direct or group thread
        const {participant_user_ids, type, group_id} = body;
        const newThread: ChatThread = {
            thread_id: 'th-' + (chatThreads.length + 1),
            type: type || 'DIRECT',
            participant_user_ids: participant_user_ids || [],
            group_id: group_id || null,
            last_message_at: null,
            last_message_preview: null
        };
        chatThreads.push(newThread);
        return {data: newThread};
    }
    if (url.startsWith('/calendar/events')) {
        const {title, start, end, color, description, location} = body;
        if (!title || !start || !end) throw {status: 400, message: 'title, start, end required'};
        const ev: CalendarEvent = {
            id: 'cal-' + (calendarEvents.length + 1),
            title,
            start,
            end,
            color,
            description,
            location
        };
        calendarEvents.push(ev);
        return {data: ev};
    }
    if (url.startsWith('/password-reset-requests')) {
        // create new reset request (PENDING)
        const {user_id} = body;
        if (!user_id) throw {status: 400, message: 'user_id required'};
        const existing = passwordResetRequests.find(r => r.user_id === user_id && r.status === 'PENDING');
        if (existing) return {data: existing};
        const req: PasswordResetRequest = {
            id: 'prr-' + (passwordResetRequests.length + 1),
            user_id,
            created_at: new Date().toISOString(),
            status: 'PENDING'
        };
        passwordResetRequests.push(req);
        return {data: req};
    }
    if (url.startsWith('/invitations/') && url.endsWith('/accept')) {
        const id = url.split('/')[2];
        const inv = invitations.find(i => i.invitation_id === id && i.status === 'PENDING');
        if (!inv) throw {status: 404, message: 'Invitation not found'};
        inv.status = 'ACCEPTED';
        return {data: inv};
    }
    if (url.startsWith('/invitations/') && url.endsWith('/decline')) {
        const id = url.split('/')[2];
        const inv = invitations.find(i => i.invitation_id === id && i.status === 'PENDING');
        if (!inv) throw {status: 404, message: 'Invitation not found'};
        inv.status = 'DECLINED';
        return {data: inv};
    }
    if (url.startsWith('/tenant-join-requests')) {
        const {tenantId} = body || {};
        if (!tenantId) throw {status: 400, message: 'tenantId required'};
        const tenant = tenants.find(t => t.tenant_id === tenantId);
        if (!tenant) throw {status: 404, message: 'Tenant not found'};
        const currentUser = users.find(u => u.user_id === currentUserId);
        const req = {
            request_id: 'tjr-' + (tenantJoinRequests.length + 1),
            tenant_id: tenant.tenant_id,
            tenant_name: tenant.tenant_name,
            created_at: new Date().toISOString(),
            status: 'PENDING',
            username: currentUser?.username,
        };
        tenantJoinRequests.push(req);
        return {data: req};
    }
    if (url.startsWith('/tenant-invitations')) {
        const {tenantId, email, username} = body || {};
        if (!tenantId || (!email && !username)) throw {status: 400, message: 'tenantId and email or username required'};
        const inv = {
            invitation_id: 'tinv-' + (tenantInvitations.length + 1),
            tenant_id: tenantId,
            tenant_name: tenants.find(t => t.tenant_id === tenantId)?.tenant_name || 'Unknown',
            invited_email: email || null,
            invited_username: username || null,
            status: 'PENDING',
            created_at: new Date().toISOString(),
        };
        tenantInvitations.push(inv);
        return {data: inv};
    }
    if (url.startsWith('/tms/tasks')) {
        const newTask = { id: 'task-' + (tmsTasks.length + 1), ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        tmsTasks.push(newTask);
        return {data: newTask};
    }
    if (url.startsWith('/tms/workflows/instances')) {
        const inst = { id: 'wfi-' + (tmsWorkflowInstances.length + 1), ...body, createdAt: new Date().toISOString() };
        tmsWorkflowInstances.push(inst);
        return {data: inst};
    }
    if (url.startsWith('/tms/workflows')) {
        const wf = { id: 'wf-' + (tmsWorkflows.length + 1), ...body, createdAt: new Date().toISOString() };
        tmsWorkflows.push(wf);
        return {data: wf};
    }
    if (url.startsWith('/tms/workflow-states')) {
        const { workflowId, key, name, metadata } = body || {};
        if (!workflowId || !key || !name) throw {status: 400, message: 'workflowId, key, name required'};
        const state = { id: 'wfs-' + (tmsWorkflowStates.length + 1), workflowId, key, name, metadata, createdAt: new Date().toISOString() };
        tmsWorkflowStates.push(state);
        return {data: state};
    }
    if (url.startsWith('/tms/workflow-transitions')) {
        const { workflowId, name, fromStateId, toStateId, conditions, actions, metadata } = body || {};
        if (!workflowId || !name || !fromStateId || !toStateId) throw {status: 400, message: 'workflowId, name, fromStateId, toStateId required'};
        const tr = { id: 'wft-' + (tmsWorkflowTransitions.length + 1), workflowId, name, fromStateId, toStateId, conditions, actions, metadata, createdAt: new Date().toISOString() };
        tmsWorkflowTransitions.push(tr);
        return {data: tr};
    }
    if (url.startsWith('/tms/sla-policies')) {
        const name = body?.name || 'Policy ' + (tmsSlaPolicies.length + 1);
        const targetHours = Number(body?.targetHours) || 24;
        const rec: MockSlaPolicy = {
            slaPolicyId: 'sla-' + (tmsSlaPolicies.length + 1),
            name,
            description: body?.description,
            targetHours,
            durationSeconds: targetHours * 3600,
            createdAt: new Date().toISOString(),
        };
        tmsSlaPolicies.push(rec);
        return {data: rec};
    }
    // Inventory POST
    if (url.startsWith('/inventory/categories')) {
        const nc: InventoryCategory = {
            id: 'cat-' + (inventoryCategories.length + 1),
            name: body.name || 'Category',
            description: body.description || '',
            createdAt: new Date().toISOString()
        };
        inventoryCategories.push(nc);
        return {data: nc};
    }
    if (url.startsWith('/inventory/locations')) {
        const nl: InventoryLocation = {
            id: 'loc-' + (inventoryLocations.length + 1),
            name: body.name || 'Location',
            description: body.description || '',
            createdAt: new Date().toISOString()
        };
        inventoryLocations.push(nl);
        return {data: nl};
    }
    if (url.startsWith('/inventory/items')) {
        const ni: InventoryItem = {
            id: 'inv-' + (inventoryItems.length + 1),
            sku: body.sku || ('SKU-' + (inventoryItems.length + 1)),
            name: body.name || 'Item',
            categoryId: body.categoryId,
            locationId: body.locationId,
            quantity: Number(body.quantity) || 0,
            reorderLevel: body.reorderLevel ? Number(body.reorderLevel) : undefined,
            description: body.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        inventoryItems.push(ni);
        return {data: ni};
    }
    if (url.startsWith('/inventory/movements')) {
        const itemId = body.itemId;
        const delta = Number(body.delta) || 0;
        const item = inventoryItems.find(i => i.id === itemId);
        if (!item) throw {status: 404, message: 'Item not found'};
        item.quantity = item.quantity + delta;
        item.updatedAt = new Date().toISOString();
        const mv: InventoryMovement = {
            id: 'mov-' + (inventoryMovements.length + 1),
            itemId,
            delta,
            reason: body.reason || '',
            createdAt: new Date().toISOString(),
            resultingQuantity: item.quantity
        };
        inventoryMovements.push(mv);
        return {data: mv};
    }
    // Finance POST
    if (url.startsWith('/finance/accounts')) {
        const code: string | undefined = body.code;
        if (code != null && code !== '' && !/^\d+$/.test(String(code))) throw { status: 400, message: 'code must be numeric' };
        const type = (body.type || '').toUpperCase();
        if (type !== 'ASSET' && type !== 'LIABILITY') throw { status: 400, message: 'type must be ASSET or LIABILITY' };
        const currency: string = (body.currency || 'USD').toUpperCase();
        const balCentsRaw = body.balanceCents != null ? Number(body.balanceCents) : null;
        const balanceCents = Number.isFinite(balCentsRaw) ? Math.round(Number(balCentsRaw)) : 0;
        const na: MockFinanceAccount = {
            id: 'fa-' + (financeAccounts.length + 1),
            tenantId: body.tenantId || null,
            type: type as 'ASSET' | 'LIABILITY',
            name: body.name,
            code: code || undefined,
            currency,
            balanceCents,
            description: body.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        financeAccounts.push(na);
        return {data: na};
    }
    if (url.startsWith('/finance/transactions')) {
        const { tenantId, date, currency, reference, memo, lines } = body || {};
        const cur = (currency || 'USD').toUpperCase();
        if (!date) throw { status: 400, message: 'date required' };
        if (!/^[A-Z]{3}$/.test(cur)) throw { status: 400, message: 'currency must be 3-letter code' };
        const arr: any[] = Array.isArray(lines) ? lines : [];
        if (arr.length < 2) throw { status: 400, message: 'need at least 2 lines' };
        let debit = 0, credit = 0;
        for (const l of arr) {
            const acct = financeAccounts.find(a => a.id === l.accountId);
            if (!acct) throw { status: 400, message: 'invalid account in lines' };
            const d = Math.max(0, Math.round(Number(l.debitCents) || 0));
            const c = Math.max(0, Math.round(Number(l.creditCents) || 0));
            if (d > 0 && c > 0) throw { status: 400, message: 'line cannot have both debit and credit' };
            if (d === 0 && c === 0) throw { status: 400, message: 'line must have debit or credit' };
            debit += d; credit += c;
        }
        if (debit !== credit || debit === 0) throw { status: 400, message: 'entry must be balanced and non-zero' };
        const rec: MockFinanceTransaction = {
            id: 'ftx-' + (financeTransactions.length + 1),
            tenantId: tenantId || null,
            date,
            currency: cur,
            reference: reference || '',
            memo: memo || '',
            status: 'POSTED',
            lines: arr.map(l => ({ accountId: l.accountId, description: l.description || '', debitCents: Math.round(Number(l.debitCents) || 0), creditCents: Math.round(Number(l.creditCents) || 0) })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        financeTransactions.push(rec);
        return { data: rec };
    }
    if (url.startsWith('/groups')) {
        // create new global group
        const newGroup: Group = {
            group_id: `group-${groups.length + 1}`,
            group_name: body.group_name,
            group_description: body.group_description,
            tenant_id: null
        };
        groups.push(newGroup);
        return {data: newGroup};
    }
    if (url.startsWith('/roles')) {
        // create new role
        const newRole: Role = {
            role_id: `role-${roles.length + 1}`,
            name: body.name,
            scope: body.scope
        };
        roles.push(newRole);
        return {data: newRole};
    }
    if (url.startsWith('/permissions')) {
        const newPerm: Permission = {
            permission_id: `perm-${permissions.length + 1}`,
            name: body.name,
            description: body.description
        };
        permissions.push(newPerm);
        return {data: newPerm};
    }
    if (url.startsWith('/applications')) {
        const newApp: Application = {
            application_id: `app-${applications.length + 1}`,
            name: body.name,
            description: body.description,
            host: body.host || null
        };
        applications.push(newApp);
        return {data: newApp};
    }
    if (url.startsWith('/chat/messages')) {
        const {thread_id, body: messageBody, sender_user_id} = body;
        const tid = thread_id || 'th-new';
        let thread = chatThreads.find(t => t.thread_id === tid);
        if (!thread) {
            thread = {
                thread_id: tid,
                type: 'DIRECT',
                participant_user_ids: [sender_user_id],
                last_message_at: new Date().toISOString(),
                last_message_preview: messageBody
            };
            chatThreads.push(thread);
        }
        const msg: ChatMessage = {
            message_id: 'msg-' + (chatMessages.length + 1),
            thread_id: thread.thread_id,
            sender_user_id,
            body: messageBody,
            created_at: new Date().toISOString()
        };
        chatMessages.push(msg);
        thread.last_message_at = msg.created_at;
        thread.last_message_preview = messageBody;
        return {data: msg};
    }
    if (url.startsWith('/chat/threads')) {
        // create direct or group thread
        const {participant_user_ids, type, group_id} = body;
        const newThread: ChatThread = {
            thread_id: 'th-' + (chatThreads.length + 1),
            type: type || 'DIRECT',
            participant_user_ids: participant_user_ids || [],
            group_id: group_id || null,
            last_message_at: null,
            last_message_preview: null
        };
        chatThreads.push(newThread);
        return {data: newThread};
    }
    if (url.startsWith('/calendar/events')) {
        const {title, start, end, color, description, location} = body;
        if (!title || !start || !end) throw {status: 400, message: 'title, start, end required'};
        const ev: CalendarEvent = {
            id: 'cal-' + (calendarEvents.length + 1),
            title,
            start,
            end,
            color,
            description,
            location
        };
        calendarEvents.push(ev);
        return {data: ev};
    }
    if (url.startsWith('/password-reset-requests')) {
        // create new reset request (PENDING)
        const {user_id} = body;
        if (!user_id) throw {status: 400, message: 'user_id required'};
        const existing = passwordResetRequests.find(r => r.user_id === user_id && r.status === 'PENDING');
        if (existing) return {data: existing};
        const req: PasswordResetRequest = {
            id: 'prr-' + (passwordResetRequests.length + 1),
            user_id,
            created_at: new Date().toISOString(),
            status: 'PENDING'
        };
        passwordResetRequests.push(req);
        return {data: req};
    }
    if (url.startsWith('/invitations/') && url.endsWith('/accept')) {
        const id = url.split('/')[2];
        const inv = invitations.find(i => i.invitation_id === id && i.status === 'PENDING');
        if (!inv) throw {status: 404, message: 'Invitation not found'};
        inv.status = 'ACCEPTED';
        return {data: inv};
    }
    if (url.startsWith('/invitations/') && url.endsWith('/decline')) {
        const id = url.split('/')[2];
        const inv = invitations.find(i => i.invitation_id === id && i.status === 'PENDING');
        if (!inv) throw {status: 404, message: 'Invitation not found'};
        inv.status = 'DECLINED';
        return {data: inv};
    }
    if (url.startsWith('/tenant-join-requests')) {
        const {tenantId} = body || {};
        if (!tenantId) throw {status: 400, message: 'tenantId required'};
        const tenant = tenants.find(t => t.tenant_id === tenantId);
        if (!tenant) throw {status: 404, message: 'Tenant not found'};
        const currentUser = users.find(u => u.user_id === currentUserId);
        const req = {
            request_id: 'tjr-' + (tenantJoinRequests.length + 1),
            tenant_id: tenant.tenant_id,
            tenant_name: tenant.tenant_name,
            created_at: new Date().toISOString(),
            status: 'PENDING',
            username: currentUser?.username,
        };
        tenantJoinRequests.push(req);
        return {data: req};
    }
    if (url.startsWith('/tenant-invitations')) {
        const {tenantId, email, username} = body || {};
        if (!tenantId || (!email && !username)) throw {status: 400, message: 'tenantId and email or username required'};
        const inv = {
            invitation_id: 'tinv-' + (tenantInvitations.length + 1),
            tenant_id: tenantId,
            tenant_name: tenants.find(t => t.tenant_id === tenantId)?.tenant_name || 'Unknown',
            invited_email: email || null,
            invited_username: username || null,
            status: 'PENDING',
            created_at: new Date().toISOString(),
        };
        tenantInvitations.push(inv);
        return {data: inv};
    }
    if (url.startsWith('/tms/tasks')) {
        const newTask = { id: 'task-' + (tmsTasks.length + 1), ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        tmsTasks.push(newTask);
        return {data: newTask};
    }
    if (url.startsWith('/tms/workflows/instances')) {
        const inst = { id: 'wfi-' + (tmsWorkflowInstances.length + 1), ...body, createdAt: new Date().toISOString() };
        tmsWorkflowInstances.push(inst);
        return {data: inst};
    }
    if (url.startsWith('/tms/workflows')) {
        const wf = { id: 'wf-' + (tmsWorkflows.length + 1), ...body, createdAt: new Date().toISOString() };
        tmsWorkflows.push(wf);
        return {data: wf};
    }
    if (url.startsWith('/tms/workflow-states')) {
        const { workflowId, key, name, metadata } = body || {};
        if (!workflowId || !key || !name) throw {status: 400, message: 'workflowId, key, name required'};
        const state = { id: 'wfs-' + (tmsWorkflowStates.length + 1), workflowId, key, name, metadata, createdAt: new Date().toISOString() };
        tmsWorkflowStates.push(state);
        return {data: state};
    }
    if (url.startsWith('/tms/workflow-transitions')) {
        const { workflowId, name, fromStateId, toStateId, conditions, actions, metadata } = body || {};
        if (!workflowId || !name || !fromStateId || !toStateId) throw {status: 400, message: 'workflowId, name, fromStateId, toStateId required'};
        const tr = { id: 'wft-' + (tmsWorkflowTransitions.length + 1), workflowId, name, fromStateId, toStateId, conditions, actions, metadata, createdAt: new Date().toISOString() };
        tmsWorkflowTransitions.push(tr);
        return {data: tr};
    }
    // Finance DELETE
    if (url.startsWith('/finance/accounts/')) {
        const id = url.split('/').pop();
        const idx = financeAccounts.findIndex(a => a.id === id);
        if (idx !== -1) financeAccounts.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/finance/transactions/')) {
        const id = url.split('/').pop();
        const idx = financeTransactions.findIndex(t => t.id === id);
        if (idx !== -1) financeTransactions.splice(idx, 1);
        return {data: {success: true}};
    }
    // Inventory DELETE
    if (url.startsWith('/inventory/categories/')) {
        const id = url.split('/').pop();
        const idx = inventoryCategories.findIndex(c => c.id === id);
        if (idx !== -1) inventoryCategories.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/inventory/locations/')) {
        const id = url.split('/').pop();
        const idx = inventoryLocations.findIndex(c => c.id === id);
        if (idx !== -1) inventoryLocations.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/inventory/items/')) {
        const id = url.split('/').pop();
        const idx = inventoryItems.findIndex(c => c.id === id);
        if (idx !== -1) inventoryItems.splice(idx, 1);
        return {data: {success: true}};
    }
    // Finance DELETE
    if (url.startsWith('/finance/accounts/')) {
        const id = url.split('/').pop();
        const idx = financeAccounts.findIndex(a => a.id === id);
        if (idx !== -1) financeAccounts.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/finance/transactions/')) {
        const id = url.split('/').pop();
        const idx = financeTransactions.findIndex(t => t.id === id);
        if (idx !== -1) financeTransactions.splice(idx, 1);
        return {data: {success: true}};
    }
    // POS DELETE
    if (url.startsWith('/pos/products/')) {
        const id = url.split('/').pop();
        const idx = posProducts.findIndex(p => p.id === id);
        if (idx !== -1) posProducts.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/pos/customers/')) {
        const id = url.split('/').pop();
        const idx = posCustomers.findIndex(p => p.id === id);
        if (idx !== -1) posCustomers.splice(idx, 1);
        return {data: {success: true}};
    }
    // Tax DELETE
    if (url.startsWith('/tax/jurisdictions/')) {
        const id = url.split('/').pop();
        const idx = taxJurisdictions.findIndex(j => j.id === id);
        if (idx !== -1) taxJurisdictions.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/tax/categories/')) {
        const id = url.split('/').pop();
        const idx = taxCategories.findIndex(j => j.id === id);
        if (idx !== -1) taxCategories.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/tax/rules/')) {
        const id = url.split('/').pop();
        const idx = taxRules.findIndex(j => j.id === id);
        if (idx !== -1) taxRules.splice(idx, 1);
        return {data: {success: true}};
    }
    return {data: {success: false}};
};
// --- Inventory (mock) ---
const inventoryCategories: InventoryCategory[] = [
    { id: 'cat-1', name: 'Beverages', description: 'Drinks', createdAt: new Date().toISOString() },
    { id: 'cat-2', name: 'Snacks', description: 'Quick bites', createdAt: new Date().toISOString() },
];
const inventoryLocations: InventoryLocation[] = [
    { id: 'loc-1', name: 'Warehouse A', description: 'Primary WH', createdAt: new Date().toISOString() },
    { id: 'loc-2', name: 'Store Front', description: 'Retail floor', createdAt: new Date().toISOString() },
];
const inventoryItems: InventoryItem[] = [
    { id: 'inv-1', sku: 'SKU-1', name: 'Cola 12oz', categoryId: 'cat-1', locationId: 'loc-2', quantity: 24, reorderLevel: 6, description: 'Soda', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'inv-2', sku: 'SKU-2', name: 'Chips 2oz', categoryId: 'cat-2', locationId: 'loc-2', quantity: 50, reorderLevel: 10, description: 'Snack', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const inventoryMovements: InventoryMovement[] = [];

// --- Finance (mock) ---
interface MockFinanceAccount { id: string; tenantId?: string | null; type: 'ASSET' | 'LIABILITY'; name: string; code?: string; currency: string; balanceCents: number; description?: string; createdAt: string; updatedAt: string }
const financeAccounts: MockFinanceAccount[] = [
  { id: 'fa-1', tenantId: tenants[0].tenant_id, type: 'ASSET', name: 'Cash', code: '1000', currency: 'USD', balanceCents: 12500, description: 'Cash and equivalents', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'fa-2', tenantId: tenants[0].tenant_id, type: 'LIABILITY', name: 'Accounts Payable', code: '2000', currency: 'USD', balanceCents: 450000, description: 'Vendors payable', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
interface MockFinanceTransactionLine { accountId: string; description?: string; debitCents?: number; creditCents?: number }
interface MockFinanceTransaction { id: string; tenantId?: string | null; date: string; currency: string; reference?: string; memo?: string; status?: 'POSTED' | 'DRAFT' | 'VOID'; lines: MockFinanceTransactionLine[]; createdAt: string; updatedAt: string }
const financeTransactions: MockFinanceTransaction[] = [
    { id: 'ftx-1', tenantId: tenants[0].tenant_id, date: new Date().toISOString().slice(0,10), currency: 'USD', reference: 'JE-1001', memo: 'Opening balance', status: 'POSTED', lines: [ { accountId: 'fa-1', debitCents: 12500 }, { accountId: 'fa-2', creditCents: 12500 } ], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// --- POS (mock) ---
interface MockPosProduct { id: string; sku: string; name: string; priceCents: number; active?: boolean; createdAt?: string; updatedAt?: string }
interface MockPosCustomer { id: string; name: string; email?: string; phone?: string; createdAt?: string; updatedAt?: string }
interface MockPosSaleItem { productId: string; quantity: number; unitPriceCents: number; lineTotalCents: number }
interface MockPosSale { id: string; customerId?: string; items: MockPosSaleItem[]; subtotalCents: number; taxCents: number; totalCents: number; createdAt: string }
const posProducts: MockPosProduct[] = [
    { id: 'pp-1', sku: 'POS-1', name: 'Coffee', priceCents: 299, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'pp-2', sku: 'POS-2', name: 'Tea', priceCents: 249, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const posCustomers: MockPosCustomer[] = [
    { id: 'pc-1', name: 'Alice', email: 'alice@example.com', phone: '555-1000', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const posSales: MockPosSale[] = [];

// --- Tax (mock) ---
interface MockTaxJurisdiction { id: string; code: string; name: string; createdAt?: string; updatedAt?: string }
interface MockTaxCategory { id: string; name: string; description?: string; defaultRatePercent?: number; createdAt?: string; updatedAt?: string }
interface MockTaxRule { id: string; name: string; jurisdictionId: string; categoryId?: string; ratePercent: number; active?: boolean; createdAt?: string; updatedAt?: string }
interface MockTaxTransactionLine { categoryId?: string; ruleId?: string; amountCents: number; appliedRatePercent: number; taxCents: number }
interface MockTaxTransaction { id: string; jurisdictionId: string; lines: MockTaxTransactionLine[]; subtotalCents: number; taxCents: number; totalCents: number; createdAt: string }
const taxJurisdictions: MockTaxJurisdiction[] = [
    { id: 'txj-1', code: 'CA', name: 'California', createdAt: new Date().toISOString() },
];
const taxCategories: MockTaxCategory[] = [
    { id: 'txc-1', name: 'Food', description: 'Groceries', defaultRatePercent: 0, createdAt: new Date().toISOString() },
    { id: 'txc-2', name: 'General', description: 'General goods', defaultRatePercent: 7.5, createdAt: new Date().toISOString() },
];
const taxRules: MockTaxRule[] = [
    { id: 'txr-1', name: 'CA General', jurisdictionId: 'txj-1', ratePercent: 7.5, active: true, createdAt: new Date().toISOString() },
];
const taxTransactions: MockTaxTransaction[] = [];

// --- ITDN Shuttle (mock) ---
interface ShuttleStop { id: string; hotelId: string; name: string; lat: number; lng: number }
interface ShuttleVehicle { id: string; hotelId: string; name: string; lat: number; lng: number; lastUpdated: string; shiftMiles: number; active?: boolean }
interface ShuttleBooking { id: string; hotelId: string; guestName: string; guestEmail: string; pickupStopId: string; dropoffStopId: string; scheduledAt: string; status: 'BOOKED' | 'EN_ROUTE' | 'PICKED_UP' | 'DROPPED_OFF' | 'RUNNING_LATE'; assignedVehicleId?: string | null; etaMinutes?: number | null; trackingCode: string; createdAt: string; updatedAt: string; notes?: string; passengers?: number }
const shuttleStops: ShuttleStop[] = [
    { id: 'stop-1', hotelId: tenants[0].tenant_id, name: 'Lobby', lat: 37.7749, lng: -122.4194 },
    { id: 'stop-2', hotelId: tenants[0].tenant_id, name: 'Airport', lat: 37.6213, lng: -122.3790 },
];
const shuttleVehicles: ShuttleVehicle[] = [
    { id: 'veh-1', hotelId: tenants[0].tenant_id, name: 'Shuttle 1', lat: 37.77, lng: -122.41, lastUpdated: new Date().toISOString(), shiftMiles: 0, active: true },
];
const shuttleBookings: ShuttleBooking[] = [];
const shuttlePositions: { vehicleId: string; lat: number; lng: number; timestamp: string }[] = [];

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (x: number) => x * Math.PI / 180;
    const R = 3958.8; // miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function estimateEtaMinutes(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const miles = haversineMiles(lat1, lon1, lat2, lon2);
    const mph = 20; // assume 20 mph average
    return Math.max(1, Math.round((miles / mph) * 60));
}

// --- HR (mock) ---
interface HrAttendance { id: string; userId: string; clockInAt: string; clockOutAt?: string | null; durationMinutes?: number; notes?: string; createdAt: string; updatedAt: string }
interface HrShift { id: string; userId: string; start: string; end: string; role?: string; location?: string; status?: 'SCHEDULED'|'COMPLETED'|'CANCELLED'; createdAt: string; updatedAt: string }
interface HrVacation { id: string; userId: string; startDate: string; endDate: string; reason?: string; status: 'PENDING'|'APPROVED'|'DENIED'; createdAt: string; updatedAt: string }
interface HrAvailability { id: string; userId: string; start: string; end: string; notes?: string; createdAt: string; updatedAt: string }
const hrAttendance: HrAttendance[] = [];
const hrShifts: HrShift[] = [];
const hrVacations: HrVacation[] = [];
const hrAvailability: HrAvailability[] = [];
