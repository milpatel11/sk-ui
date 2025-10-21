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
    {application_id: 'app-1', name: 'User Portal', description: 'End user portal', host: '/user-management/notifications'},
    {application_id: 'admin', name: 'Admin Console', description: 'Administration console', host: '/admin'},
    {application_id: 'tms', name: 'Task Management', description: 'Track and manage tasks', host: '/task-management/board'},
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

interface MockWorkflowInstance {
    id: string;
    workflowId: string;
    name?: string;
    currentStateKey?: string;
    createdAt?: string;
}

const tmsWorkflowInstances: MockWorkflowInstance[] = [
    {
        id: 'wfi-1',
        workflowId: 'wf-1',
        name: 'Issue Instance 1',
        currentStateKey: 'open',
        createdAt: new Date().toISOString()
    },
    {
        id: 'wfi-2',
        workflowId: 'wf-1',
        name: 'Issue Instance 2',
        currentStateKey: 'in_progress',
        createdAt: new Date().toISOString()
    },
    {
        id: 'wfi-3',
        workflowId: 'wf-2',
        name: 'Request Instance 1',
        currentStateKey: 'approval',
        createdAt: new Date().toISOString()
    }
];

interface MockSlaPolicy {
    slaPolicyId: string;
    name: string;
    description?: string;
    durationSeconds: number;
    createdAt?: string;
}

const tmsSlaPolicies: MockSlaPolicy[] = [
    {
        slaPolicyId: 'sla-1',
        name: 'Standard 48h',
        description: 'Resolution within 48 hours',
        durationSeconds: 172800,
        createdAt: new Date().toISOString()
    },
    {
        slaPolicyId: 'sla-2',
        name: 'Priority 24h',
        description: 'High priority tasks 24h',
        durationSeconds: 86400,
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

interface MockApproval {
    approvalId: string;
    taskId: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt?: string;
    approverGroupId?: string;
}

const tmsApprovals: MockApproval[] = [
    {
        approvalId: 'appr-1',
        taskId: 'task-3',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        approverGroupId: 'group-1'
    }
];

// --- Inventory Management mock domain ---
const inventoryCategories: InventoryCategory[] = [
    {id: 'cat-1', name: 'Hardware', description: 'Physical devices', createdAt: new Date().toISOString()},
    {id: 'cat-2', name: 'Software', description: 'Licenses and subscriptions', createdAt: new Date().toISOString()}
];
const inventoryLocations: InventoryLocation[] = [
    {id: 'loc-1', name: 'Warehouse A', description: 'Primary storage', createdAt: new Date().toISOString()},
    {id: 'loc-2', name: 'Warehouse B', description: 'Overflow', createdAt: new Date().toISOString()}
];
const inventoryItems: InventoryItem[] = [
    {
        id: 'inv-1',
        sku: 'HW-001',
        name: 'Router X',
        categoryId: 'cat-1',
        locationId: 'loc-1',
        quantity: 25,
        reorderLevel: 5,
        description: 'Core router',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'inv-2',
        sku: 'SW-010',
        name: 'Antivirus License',
        categoryId: 'cat-2',
        locationId: 'loc-2',
        quantity: 120,
        reorderLevel: 20,
        description: '1-year subscription',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
const inventoryMovements: InventoryMovement[] = [];

// --- POS mock domain ---
interface MockPosProduct {
    id: string;
    sku: string;
    name: string;
    priceCents: number;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface MockPosCustomer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface MockPosSaleItem {
    productId: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
}

interface MockPosSale {
    id: string;
    customerId?: string;
    items: MockPosSaleItem[];
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    createdAt: string;
}

const posProducts: MockPosProduct[] = [
    {
        id: 'pp-1',
        sku: 'P-100',
        name: 'USB-C Cable',
        priceCents: 1299,
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'pp-2',
        sku: 'P-200',
        name: 'Wireless Mouse',
        priceCents: 2599,
        active: true,
        createdAt: new Date().toISOString()
    }
];
const posCustomers: MockPosCustomer[] = [
    {id: 'pc-1', name: 'Alice Smith', email: 'alice@example.com', createdAt: new Date().toISOString()},
    {id: 'pc-2', name: 'Bob Jones', email: 'bob@example.com', createdAt: new Date().toISOString()}
];
const posSales: MockPosSale[] = [];

// --- Tax Management mock domain ---
interface MockTaxJurisdiction {
    id: string;
    code: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

interface MockTaxCategory {
    id: string;
    name: string;
    description?: string;
    defaultRatePercent: number;
    createdAt?: string;
    updatedAt?: string;
}

interface MockTaxRule {
    id: string;
    name: string;
    jurisdictionId: string;
    categoryId?: string;
    ratePercent: number;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface MockTaxTransactionLine {
    categoryId?: string;
    ruleId?: string;
    amountCents: number;
    appliedRatePercent: number;
    taxCents: number;
}

interface MockTaxTransaction {
    id: string;
    jurisdictionId: string;
    lines: MockTaxTransactionLine[];
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    createdAt: string;
}

const taxJurisdictions: MockTaxJurisdiction[] = [
    {id: 'txj-1', code: 'US-CA', name: 'California', createdAt: new Date().toISOString()},
    {id: 'txj-2', code: 'US-NY', name: 'New York', createdAt: new Date().toISOString()}
];
const taxCategories: MockTaxCategory[] = [
    {id: 'txc-1', name: 'General Goods', defaultRatePercent: 7.25, createdAt: new Date().toISOString()},
    {id: 'txc-2', name: 'Food', defaultRatePercent: 2.00, createdAt: new Date().toISOString()}
];
const taxRules: MockTaxRule[] = [
    {
        id: 'txr-1',
        name: 'CA General',
        jurisdictionId: 'txj-1',
        ratePercent: 7.25,
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'txr-2',
        name: 'CA Food',
        jurisdictionId: 'txj-1',
        categoryId: 'txc-2',
        ratePercent: 1.00,
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'txr-3',
        name: 'NY General',
        jurisdictionId: 'txj-2',
        ratePercent: 8.00,
        active: true,
        createdAt: new Date().toISOString()
    }
];
const taxTransactions: MockTaxTransaction[] = [];

// --- ITDN Shuttle mock domain ---
interface ShuttleStop { id: string; hotelId: string; name: string; lat: number; lng: number; }
interface ShuttleVehicle { id: string; name: string; hotelId: string; lat: number; lng: number; lastUpdated: string; shiftMiles: number; active?: boolean; }
interface ShuttleBooking { id: string; hotelId: string; guestName: string; guestEmail: string; pickupStopId: string; dropoffStopId: string; scheduledAt: string; status: 'BOOKED'|'EN_ROUTE'|'PICKED_UP'|'DROPPED_OFF'|'RUNNING_LATE'; assignedVehicleId?: string | null; etaMinutes?: number | null; trackingCode: string; createdAt: string; updatedAt: string; notes?: string; passengers?: number; }
interface ShuttlePosition { vehicleId: string; lat: number; lng: number; timestamp: string; }

const shuttleStops: ShuttleStop[] = [
  { id: 'stop-1', hotelId: tenants[0].tenant_id, name: 'Main Lobby', lat: 37.7749, lng: -122.4194 },
  { id: 'stop-2', hotelId: tenants[0].tenant_id, name: 'Conference Center', lat: 37.7762, lng: -122.4170 },
  { id: 'stop-3', hotelId: tenants[0].tenant_id, name: 'Airport Terminal A', lat: 37.6152, lng: -122.3899 },
  { id: 'stop-4', hotelId: tenants[1].tenant_id, name: 'Globex Lobby', lat: 34.0522, lng: -118.2437 }
];

const shuttleVehicles: ShuttleVehicle[] = [
  { id: 'veh-1', name: 'Shuttle 1', hotelId: tenants[0].tenant_id, lat: 37.7720, lng: -122.4210, lastUpdated: new Date().toISOString(), shiftMiles: 0, active: true },
  { id: 'veh-2', name: 'Shuttle 2', hotelId: tenants[0].tenant_id, lat: 37.7800, lng: -122.4150, lastUpdated: new Date().toISOString(), shiftMiles: 0, active: true }
];

const shuttleBookings: ShuttleBooking[] = [];
const shuttlePositions: ShuttlePosition[] = [];

const toRad = (v: number) => v * Math.PI / 180;
const haversineMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3958.8; // miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const estimateEtaMinutes = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  const miles = haversineMiles(fromLat, fromLng, toLat, toLng);
  const mph = 25; // average city speed
  const hours = miles / mph;
  return Math.max(1, Math.round(hours * 60));
};

// --- HR (Human Resources) mock domain ---
interface HrAttendance { id: string; userId: string; clockInAt: string; clockOutAt?: string | null; durationMinutes?: number; notes?: string; createdAt?: string; updatedAt?: string; }
interface HrShift { id: string; userId: string; start: string; end: string; role?: string; location?: string; status?: 'SCHEDULED'|'COMPLETED'|'MISSED'|'CANCELLED'; createdAt?: string; updatedAt?: string; }
interface HrVacation { id: string; userId: string; startDate: string; endDate: string; reason?: string; status: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'; createdAt?: string; updatedAt?: string; }
interface HrAvailability { id: string; userId: string; start: string; end: string; notes?: string; createdAt?: string; updatedAt?: string; }

const hrAttendance: HrAttendance[] = [];
const hrShifts: HrShift[] = [];
const hrVacations: HrVacation[] = [];
const hrAvailability: HrAvailability[] = [];

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
    if (url.startsWith('/tms/tasks')) return {data: tmsTasks};
    if (url.startsWith('/tms/workflows/instances')) return {data: tmsWorkflowInstances};
    if (url.startsWith('/tms/workflows')) return {data: tmsWorkflows};
    if (url.startsWith('/tms/sla-policies')) return {data: tmsSlaPolicies};
    if (url.startsWith('/tms/sla-timers')) return {data: tmsSlaTimers};
    if (url.startsWith('/tms/approvals')) return {data: tmsApprovals};
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
        let hotelId: string | null = null;
        try { hotelId = new URLSearchParams(url.split('?')[1]).get('hotelId'); } catch {}
        const data = shuttleStops.filter(s => !hotelId || s.hotelId === hotelId);
        return { data };
    }
    if (url.startsWith('/itdn/shuttle/vehicles/')) {
        const id = url.split('/').pop();
        const v = shuttleVehicles.find(v => v.id === id) || null;
        return { data: v };
    }
    if (url.startsWith('/itdn/shuttle/vehicles')) {
        let hotelId: string | null = null;
        try { hotelId = new URLSearchParams(url.split('?')[1]).get('hotelId'); } catch {}
        const data = shuttleVehicles.filter(v => v.active !== false && (!hotelId || v.hotelId === hotelId));
        return { data };
    }
    if (url.startsWith('/itdn/shuttle/bookings/')) {
        const id = url.split('/').pop();
        const b = shuttleBookings.find(b => b.id === id) || null;
        return { data: b };
    }
    if (url.startsWith('/itdn/shuttle/bookings')) {
        let hotelId: string | null = null;
        try { hotelId = new URLSearchParams(url.split('?')[1]).get('hotelId'); } catch {}
        const data = shuttleBookings.filter(b => !hotelId || b.hotelId === hotelId).sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
        return { data };
    }
    if (url.startsWith('/itdn/shuttle/positions')) {
        let vehicleId: string | null = null;
        try { vehicleId = new URLSearchParams(url.split('?')[1]).get('vehicleId'); } catch {}
        const data = shuttlePositions.filter(p => !vehicleId || p.vehicleId === vehicleId).slice(-50);
        return { data };
    }
    if (url.startsWith('/itdn/shuttle/track')) {
        // public tracking by code
        let code: string | null = null;
        try { code = new URLSearchParams(url.split('?')[1]).get('code'); } catch {}
        const booking = shuttleBookings.find(b => b.trackingCode === code) || null;
        if (!booking) return { data: null };
        const vehicle = booking.assignedVehicleId ? shuttleVehicles.find(v => v.id === booking.assignedVehicleId) : null;
        return { data: { booking, vehicle } };
    }
    // HR GET endpoints
    if (url.startsWith('/hr/attendance')) {
        let userId: string | null = null;
        try { userId = new URLSearchParams(url.split('?')[1]).get('userId'); } catch {}
        const data = hrAttendance.filter(r => !userId || r.userId === userId).sort((a,b)=> (b.clockInAt||'').localeCompare(a.clockInAt||''));
        return { data };
    }
    if (url.startsWith('/hr/shifts')) {
        let userId: string | null = null;
        try { userId = new URLSearchParams(url.split('?')[1]).get('userId'); } catch {}
        const data = hrShifts.filter(r => !userId || r.userId === userId).sort((a,b)=> (a.start||'').localeCompare(b.start||''));
        return { data };
    }
    if (url.startsWith('/hr/vacations')) {
        let userId: string | null = null;
        try { userId = new URLSearchParams(url.split('?')[1]).get('userId'); } catch {}
        const data = hrVacations.filter(r => !userId || r.userId === userId).sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
        return { data };
    }
    if (url.startsWith('/hr/availability')) {
        let userId: string | null = null;
        try { userId = new URLSearchParams(url.split('?')[1]).get('userId'); } catch {}
        const data = hrAvailability.filter(r => !userId || r.userId === userId).sort((a,b)=> (a.start||'').localeCompare(b.start||''));
        return { data };
    }
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
        const nt: MockTask = {
            id: 'task-' + (tmsTasks.length + 1),
            typeKey: body.typeKey || 'issue',
            title: body.title || 'Untitled',
            status: body.status || 'open',
            priority: body.priority || 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tmsTasks.push(nt);
        return {data: nt};
    }
    if (url.startsWith('/tms/sla-policies')) {
        const np: MockSlaPolicy = {
            slaPolicyId: 'sla-' + (tmsSlaPolicies.length + 1),
            name: body.name || 'New SLA',
            description: body.description || '',
            durationSeconds: body.durationSeconds || 3600,
            createdAt: new Date().toISOString()
        };
        tmsSlaPolicies.push(np);
        return {data: np};
    }
    if (url.startsWith('/tms/workflows')) {
        const nw: MockWorkflow = {
            id: 'wf-' + (tmsWorkflows.length + 1),
            name: body.name || 'Workflow',
            description: body.description || '',
            definition: body.definition || {},
            createdAt: new Date().toISOString()
        };
        tmsWorkflows.push(nw);
        return {data: nw};
    }
    if (url.startsWith('/tms/workflows/instances')) {
        const ni: MockWorkflowInstance = {
            id: 'wfi-' + (tmsWorkflowInstances.length + 1),
            workflowId: body.workflowId || tmsWorkflows[0]?.id || 'wf-1',
            name: body.name || 'Instance',
            currentStateKey: body.currentStateKey || 'open',
            createdAt: new Date().toISOString()
        };
        tmsWorkflowInstances.push(ni);
        return {data: ni};
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
    // POS POST
    if (url.startsWith('/pos/products')) {
        const np: MockPosProduct = {
            id: 'pp-' + (posProducts.length + 1),
            sku: body.sku || ('POS-' + (posProducts.length + 1)),
            name: body.name || 'Product',
            priceCents: Number(body.priceCents) || 0,
            active: body.active !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        posProducts.push(np);
        return {data: np};
    }
    if (url.startsWith('/pos/customers')) {
        const nc: MockPosCustomer = {
            id: 'pc-' + (posCustomers.length + 1),
            name: body.name || 'Customer',
            email: body.email || '',
            phone: body.phone || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        posCustomers.push(nc);
        return {data: nc};
    }
    if (url.startsWith('/pos/sales')) {
        const itemsReq: any[] = Array.isArray(body.items) ? body.items : [];
        const saleItems: MockPosSaleItem[] = itemsReq.map((r) => {
             const prod = posProducts.find(p => p.id === r.productId);
             const unit = prod ? prod.priceCents : Number(r.unitPriceCents) || 0;
             const qty = Number(r.quantity) || 1;
             return {productId: r.productId, quantity: qty, unitPriceCents: unit, lineTotalCents: unit * qty};
         });
        const subtotal = saleItems.reduce((a, i) => a + i.lineTotalCents, 0);
        const tax = Math.round(subtotal * 0.07); // 7% mock tax
        const total = subtotal + tax;
        const sale: MockPosSale = {
            id: 'ps-' + (posSales.length + 1),
            customerId: body.customerId,
            items: saleItems,
            subtotalCents: subtotal,
            taxCents: tax,
            totalCents: total,
            createdAt: new Date().toISOString()
        };
        posSales.push(sale);
        return {data: sale};
    }
    // Tax POST
    if (url.startsWith('/tax/jurisdictions')) {
        const nj: MockTaxJurisdiction = {
            id: 'txj-' + (taxJurisdictions.length + 1),
            code: body.code || ('J-' + (taxJurisdictions.length + 1)),
            name: body.name || 'Jurisdiction',
            createdAt: new Date().toISOString()
        };
        taxJurisdictions.push(nj);
        return {data: nj};
    }
    if (url.startsWith('/tax/categories')) {
        const nc: MockTaxCategory = {
            id: 'txc-' + (taxCategories.length + 1),
            name: body.name || 'Category',
            description: body.description || '',
            defaultRatePercent: Number(body.defaultRatePercent) || 0,
            createdAt: new Date().toISOString()
        };
        taxCategories.push(nc);
        return {data: nc};
    }
    if (url.startsWith('/tax/rules')) {
        const nr: MockTaxRule = {
            id: 'txr-' + (taxRules.length + 1),
            name: body.name || 'Rule',
            jurisdictionId: body.jurisdictionId || taxJurisdictions[0]?.id,
            categoryId: body.categoryId || undefined,
            ratePercent: Number(body.ratePercent) || 0,
            active: body.active !== false,
            createdAt: new Date().toISOString()
        };
        taxRules.push(nr);
        return {data: nr};
    }
    if (url.startsWith('/tax/transactions')) {
        const jurisdictionId = body.jurisdictionId || taxJurisdictions[0]?.id;
        const linesReq: any[] = Array.isArray(body.lines) ? body.lines : [];
        const lines: MockTaxTransactionLine[] = linesReq.map(l => {
            const amountCents = Number(l.amountCents) || 0;
            let appliedRate = 0;
            if (l.ruleId) {
                const rule = taxRules.find(r => r.id === l.ruleId && r.active !== false);
                appliedRate = rule ? rule.ratePercent : 0;
            } else {
                // find specific category rule else jurisdiction general else category default
                const catId = l.categoryId;
                const catRule = taxRules.find(r => r.jurisdictionId === jurisdictionId && r.categoryId === catId && r.active !== false);
                if (catRule) appliedRate = catRule.ratePercent; else {
                    const genRule = taxRules.find(r => r.jurisdictionId === jurisdictionId && !r.categoryId && r.active !== false);
                    if (genRule) appliedRate = genRule.ratePercent; else {
                        const cat = taxCategories.find(c => c.id === catId);
                        appliedRate = cat ? cat.defaultRatePercent : 0;
                    }
                }
            }
            const taxCents = Math.round(amountCents * appliedRate / 100);
            return {categoryId: l.categoryId, ruleId: l.ruleId, amountCents, appliedRatePercent: appliedRate, taxCents};
        });
        const subtotal = lines.reduce((a, l) => a + l.amountCents, 0);
        const tax = lines.reduce((a, l) => a + l.taxCents, 0);
        const tx: MockTaxTransaction = {
            id: 'txt-' + (taxTransactions.length + 1),
            jurisdictionId,
            lines,
            subtotalCents: subtotal,
            taxCents: tax,
            totalCents: subtotal + tax,
            createdAt: new Date().toISOString()
        };
        taxTransactions.push(tx);
        return {data: tx};
    }
    if (url.startsWith('/itdn/shuttle/bookings')) {
        const { hotelId, guestName, guestEmail, pickupStopId, dropoffStopId, scheduledAt, notes, passengers } = body || {};
        if (!hotelId || !guestName || !guestEmail || !pickupStopId || !dropoffStopId) throw { status: 400, message: 'Missing required fields' };
        const id = 'sbk-' + (shuttleBookings.length + 1);
        const trackingCode = 'trk-' + Math.random().toString(36).slice(2, 10);
        const now = new Date().toISOString();
        const pickup = shuttleStops.find(s => s.id === pickupStopId);
        const vehicle = shuttleVehicles.find(v => v.hotelId === hotelId);
        const eta = vehicle && pickup ? estimateEtaMinutes(vehicle.lat, vehicle.lng, pickup.lat, pickup.lng) : null;
        const b: ShuttleBooking = { id, hotelId, guestName, guestEmail, pickupStopId, dropoffStopId, scheduledAt: scheduledAt || now, status: 'BOOKED', assignedVehicleId: vehicle?.id || null, etaMinutes: eta, trackingCode, createdAt: now, updatedAt: now, notes: notes || '', passengers: passengers ? Number(passengers) : 1 };
        shuttleBookings.push(b);
        return { data: b };
    }
    if (url.startsWith('/itdn/shuttle/vehicles/') && url.endsWith('/position')) {
        const id = url.split('/')[3];
        const v = shuttleVehicles.find(v => v.id === id);
        if (!v) throw { status: 404, message: 'Vehicle not found' };
        const prevLat = v.lat, prevLng = v.lng;
        v.lat = typeof body.lat === 'number' ? body.lat : v.lat;
        v.lng = typeof body.lng === 'number' ? body.lng : v.lng;
        v.lastUpdated = new Date().toISOString();
        const miles = haversineMiles(prevLat, prevLng, v.lat, v.lng);
        v.shiftMiles += miles;
        shuttlePositions.push({ vehicleId: v.id, lat: v.lat, lng: v.lng, timestamp: v.lastUpdated });
        // Update any EN_ROUTE or BOOKED booking ETA
        shuttleBookings.forEach(b => {
            if (b.assignedVehicleId === v.id && (b.status === 'BOOKED' || b.status === 'EN_ROUTE')) {
                const pickup = shuttleStops.find(s => s.id === b.pickupStopId);
                if (pickup) b.etaMinutes = estimateEtaMinutes(v.lat, v.lng, pickup.lat, pickup.lng);
                b.updatedAt = v.lastUpdated;
            }
        });
        return { data: v };
    }
    // HR POST endpoints
    if (url.startsWith('/hr/attendance/clock-in')) {
        const { userId, notes } = body || {};
        if (!userId) throw { status: 400, message: 'userId required' };
        const open = hrAttendance.find(r => r.userId === userId && !r.clockOutAt);
        if (open) throw { status: 400, message: 'Already clocked in' };
        const now = new Date().toISOString();
        const rec: HrAttendance = { id: 'hra-' + (hrAttendance.length + 1), userId, clockInAt: now, clockOutAt: null, notes, createdAt: now, updatedAt: now };
        hrAttendance.push(rec);
        return { data: rec };
    }
    if (url.startsWith('/hr/attendance/clock-out')) {
        const { userId } = body || {};
        if (!userId) throw { status: 400, message: 'userId required' };
        const open = [...hrAttendance].reverse().find(r => r.userId === userId && !r.clockOutAt);
        if (!open) throw { status: 400, message: 'No open attendance' };
        const now = new Date().toISOString();
        open.clockOutAt = now;
        const durMin = Math.max(1, Math.round((new Date(now).getTime() - new Date(open.clockInAt).getTime()) / 60000));
        open.durationMinutes = durMin;
        open.updatedAt = now;
        return { data: open };
    }
    if (url.startsWith('/hr/shifts')) {
        const { userId, start, end, role, location } = body || {};
        if (!userId || !start || !end) throw { status: 400, message: 'userId, start, end required' };
        const rec: HrShift = { id: 'hrs-' + (hrShifts.length + 1), userId, start, end, role, location, status: 'SCHEDULED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        hrShifts.push(rec);
        return { data: rec };
    }
    if (url.startsWith('/hr/vacations')) {
        const { userId, startDate, endDate, reason } = body || {};
        if (!userId || !startDate || !endDate) throw { status: 400, message: 'userId, startDate, endDate required' };
        const rec: HrVacation = { id: 'hrv-' + (hrVacations.length + 1), userId, startDate, endDate, reason, status: 'PENDING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        hrVacations.push(rec);
        return { data: rec };
    }
    if (url.startsWith('/hr/availability')) {
        const { userId, start, end, notes } = body || {};
        if (!userId || !start || !end) throw { status: 400, message: 'userId, start, end required' };
        const rec: HrAvailability = { id: 'hrav-' + (hrAvailability.length + 1), userId, start, end, notes, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        hrAvailability.push(rec);
        return { data: rec };
    }
    return {data: body};
};

export const mockPatch = async (url: string, body: any) => {
    await new Promise(r => setTimeout(r, 120));
    if (url.startsWith('/users/')) {
        const id = url.split('/').pop();
        const idx = users.findIndex(u => u.user_id === id);
        if (idx !== -1) {
            users[idx] = {...users[idx], ...body};
            return {data: users[idx]};
        }
    }
    if (url.startsWith('/tenants/')) {
        const id = url.split('/').pop();
        const idx = tenants.findIndex(t => t.tenant_id === id);
        if (idx !== -1) {
            tenants[idx] = {...tenants[idx], ...body};
            return {data: tenants[idx]};
        }
        throw {status: 404, message: 'Tenant not found'};
    }
    if (url.startsWith('/itdn/shuttle/bookings/')) {
        const id = url.split('/').pop();
        const idx = shuttleBookings.findIndex(b => b.id === id);
        if (idx === -1) throw { status: 404, message: 'Not found' };
        const before = shuttleBookings[idx];
        shuttleBookings[idx] = { ...before, ...body, updatedAt: new Date().toISOString() };
        return { data: shuttleBookings[idx] };
    }
    // HR PATCH endpoints
    if (url.startsWith('/hr/shifts/')) {
        const id = url.split('/').pop();
        const idx = hrShifts.findIndex(s => s.id === id);
        if (idx === -1) throw { status: 404, message: 'Not found' };
        hrShifts[idx] = { ...hrShifts[idx], ...body, updatedAt: new Date().toISOString() };
        return { data: hrShifts[idx] };
    }
    if (url.startsWith('/hr/vacations/')) {
        const id = url.split('/').pop();
        const idx = hrVacations.findIndex(v => v.id === id);
        if (idx === -1) throw { status: 404, message: 'Not found' };
        hrVacations[idx] = { ...hrVacations[idx], ...body, updatedAt: new Date().toISOString() };
        return { data: hrVacations[idx] };
    }
    return {data: body};
};

export const mockPut = async (url: string, body: any) => {
    await new Promise(r => setTimeout(r, 120));
    if (url.startsWith('/application-users/')) {
        const parts = url.split('/');
        const application_id = parts[2];
        const user_id = parts[3];
        const entry = applicationUsers.find(a => a.application_id === application_id && a.user_id === user_id);
        if (!entry) throw {status: 404, message: 'Mapping not found'};
        if (Array.isArray(body.role_ids)) entry.role_ids = body.role_ids;
        return {data: entry};
    }
    if (url.startsWith('/password-reset-requests/')) {
        const id = url.split('/').pop();
        const req = passwordResetRequests.find(r => r.id === id);
        if (!req) throw {status: 404, message: 'Not found'};
        // Body may contain status change (APPROVED / DENIED) and optional new password token generation
        if (body.status && ['APPROVED', 'DENIED'].includes(body.status)) {
            req.status = body.status;
            if (req.status === 'APPROVED') {
                req.token = 'reset-token-' + req.id;
                req.approved_at = new Date().toISOString();
            }
        }
        return {data: req};
    }
    if (url.startsWith('/calendar/events/')) {
        const id = url.split('/').pop();
        const idx = calendarEvents.findIndex(e => e.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        calendarEvents[idx] = {...calendarEvents[idx], ...body};
        return {data: calendarEvents[idx]};
    }
    // TMS updates
    if (url.startsWith('/tms/tasks/')) {
        const id = url.split('/').pop();
        const idx = tmsTasks.findIndex(t => t.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        tmsTasks[idx] = {...tmsTasks[idx], ...body, updatedAt: new Date().toISOString()};
        return {data: tmsTasks[idx]};
    }
    if (url.startsWith('/tms/workflows/instances/')) {
        const id = url.split('/').pop();
        const idx = tmsWorkflowInstances.findIndex(i => i.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        tmsWorkflowInstances[idx] = {...tmsWorkflowInstances[idx], ...body};
        return {data: tmsWorkflowInstances[idx]};
    }
    if (url.startsWith('/tms/workflows/')) {
        const id = url.split('/').pop();
        const idx = tmsWorkflows.findIndex(w => w.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        tmsWorkflows[idx] = {...tmsWorkflows[idx], ...body};
        return {data: tmsWorkflows[idx]};
    }
    if (url.startsWith('/tms/sla-policies/')) {
        const id = url.split('/').pop();
        const idx = tmsSlaPolicies.findIndex(p => p.slaPolicyId === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        tmsSlaPolicies[idx] = {...tmsSlaPolicies[idx], ...body};
        return {data: tmsSlaPolicies[idx]};
    }
    // Inventory PUT
    if (url.startsWith('/inventory/categories/')) {
        const id = url.split('/').pop();
        const idx = inventoryCategories.findIndex(c => c.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        inventoryCategories[idx] = {...inventoryCategories[idx], ...body, updatedAt: new Date().toISOString()};
        return {data: inventoryCategories[idx]};
    }
    if (url.startsWith('/inventory/locations/')) {
        const id = url.split('/').pop();
        const idx = inventoryLocations.findIndex(c => c.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        inventoryLocations[idx] = {...inventoryLocations[idx], ...body, updatedAt: new Date().toISOString()};
        return {data: inventoryLocations[idx]};
    }
    if (url.startsWith('/inventory/items/')) {
        const id = url.split('/').pop();
        const idx = inventoryItems.findIndex(c => c.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        inventoryItems[idx] = {...inventoryItems[idx], ...body, updatedAt: new Date().toISOString()};
        return {data: inventoryItems[idx]};
    }
    // POS PUT
    if (url.startsWith('/pos/products/')) {
        const id = url.split('/').pop();
        const idx = posProducts.findIndex(p => p.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        posProducts[idx] = {...posProducts[idx], ...body, updatedAt: new Date().toISOString()};
        return {data: posProducts[idx]};
    }
    if (url.startsWith('/pos/customers/')) {
        const id = url.split('/').pop();
        const idx = posCustomers.findIndex(p => p.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        posCustomers[idx] = {...posCustomers[idx], ...body, updatedAt: new Date().toISOString()};
        return {data: posCustomers[idx]};
    }
    // Tax PUT
    if (url.startsWith('/tax/jurisdictions/')) {
        const id = url.split('/').pop();
        const idx = taxJurisdictions.findIndex(j => j.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        taxJurisdictions[idx] = {...taxJurisdictions[idx], ...body, updatedAt: new Date().toISOString()};
        return {data: taxJurisdictions[idx]};
    }
    if (url.startsWith('/tax/categories/')) {
        const id = url.split('/').pop();
        const idx = taxCategories.findIndex(j => j.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        taxCategories[idx] = {...taxCategories[idx], ...body, updatedAt: new Date().toISOString()};
        return {data: taxCategories[idx]};
    }
    if (url.startsWith('/tax/rules/')) {
        const id = url.split('/').pop();
        const idx = taxRules.findIndex(j => j.id === id);
        if (idx === -1) throw {status: 404, message: 'Not found'};
        taxRules[idx] = {...taxRules[idx], ...body, updatedAt: new Date().toISOString()};
        return {data: taxRules[idx]};
    }
    return {data: body};
};

export const mockDelete = async (url: string) => {
    await new Promise(r => setTimeout(r, 120));
    if (url.startsWith('/users/')) {
        const id = url.split('/').pop();
        const idx = users.findIndex(u => u.user_id === id);
        if (idx !== -1) users.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/password-reset-requests/')) {
        const id = url.split('/').pop();
        const idx = passwordResetRequests.findIndex(r => r.id === id);
        if (idx !== -1) passwordResetRequests.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/calendar/events/')) {
        const id = url.split('/').pop();
        const idx = calendarEvents.findIndex(e => e.id === id);
        if (idx !== -1) calendarEvents.splice(idx, 1);
        return {data: {success: true}};
    }
    // TMS deletes
    if (url.startsWith('/tms/tasks/')) {
        const id = url.split('/').pop();
        const idx = tmsTasks.findIndex(t => t.id === id);
        if (idx !== -1) tmsTasks.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/tms/workflows/instances/')) {
        const id = url.split('/').pop();
        const idx = tmsWorkflowInstances.findIndex(i => i.id === id);
        if (idx !== -1) tmsWorkflowInstances.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/tms/workflows/')) {
        const id = url.split('/').pop();
        const idx = tmsWorkflows.findIndex(w => w.id === id);
        if (idx !== -1) tmsWorkflows.splice(idx, 1);
        return {data: {success: true}};
    }
    if (url.startsWith('/tms/sla-policies/')) {
        const id = url.split('/').pop();
        const idx = tmsSlaPolicies.findIndex(p => p.slaPolicyId === id);
        if (idx !== -1) tmsSlaPolicies.splice(idx, 1);
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
