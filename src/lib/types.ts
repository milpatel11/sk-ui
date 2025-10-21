// Core domain types mapped from backend schema
export interface Tenant {
  tenant_id: string;
  tenant_name: string;
  tenant_description?: string | null;
  created_at?: string;
  // Billing address
  billing_address_line1?: string;
  billing_address_line2?: string | null;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  // Shipping address
  shipping_address_line1?: string;
  shipping_address_line2?: string | null;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
}

export interface Application {
  application_id: string;
  name: string;
  description?: string | null;
  host?: string | null;
}

export interface GlobalUser {
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  username?: string | null;
  tenant_id?: string | null;
  last_login?: string | null;
  enabled?: boolean;
  password?: string | null; // mock-only password storage (NOT for production)
}

export interface Role {
  role_id: string;
  name: string;
  scope: 'GLOBAL' | 'TENANT' | 'APPLICATION';
}

export interface Permission {
  permission_id: string;
  name: string;
  description?: string | null;
}

export interface Group {
  group_id: string;
  group_name: string;
  group_description?: string | null;
  tenant_id?: string | null;
}

// Mapping of a user to an application with assigned application-scoped role IDs
export interface ApplicationUser {
  application_id: string;
  user_id: string;
  role_ids: string[]; // only roles with scope 'APPLICATION'
}

// Mapping tables for authorization graph
export interface UserGroup {
  user_id: string;
  group_id: string;
}

export interface GroupRole {
  group_id: string;
  role_id: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

// Password reset approval workflow (admin-gated)
export interface PasswordResetRequest {
  id: string;
  user_id: string;
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  approved_at?: string;
  token?: string; // provided when approved; used to reset password
}

// --- Chat Domain (mock) ---
export interface ChatThread {
  thread_id: string;
  type: 'DIRECT' | 'GROUP';
  participant_user_ids: string[]; // for DIRECT will be 2
  group_id?: string | null; // if type GROUP and tied to an existing group
  last_message_at?: string | null;
  last_message_preview?: string | null;
}

export interface ChatMessage {
  message_id: string;
  thread_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
}

// --- Calendar / Scheduling (mock) ---
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string;   // ISO string
  color?: string;
  description?: string;
  location?: string;
  // Future: attendees, recurrence, etc.
}

// Tenant invitation (user invited to join an existing tenant)
export interface Invitation {
  invitation_id: string;
  tenant_id: string;
  tenant_name: string;
  invited_email?: string | null;
  invited_username?: string | null;
  role_names?: string[]; // roles granted upon acceptance
  created_at?: string;
  expires_at?: string | null;
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
}

// Tenant join request (user requests access to tenant)
export interface TenantJoinRequest {
  request_id: string;
  tenant_id: string;
  tenant_name: string;
  created_at?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// Shared SlaTimer model (mirrors backend SlaTimerDTO)
export interface SlaTimer {
  slaTimerId: string
  taskId: string
  policyId: string
  dueAt?: string
  breached?: boolean
  startedAt?: string
  stoppedAt?: string
  metadata?: any
  version?: number
}

export type SlaTimerDTO = SlaTimer


// Shared Approval model (mirrors backend ApprovalDTO)
export interface Approval {
  approvalId: string
  taskId: string
  sequence?: number
  approverGlobalUserId?: string
  approverApplicationUserId?: string
  approverGroupId?: string
  status: 'pending' | 'approved' | 'rejected'
  requestedBy?: string
  requestedAt?: string
  respondedBy?: string
  respondedAt?: string
  responseComment?: string
  metadata?: any
  version?: number
}

export type ApprovalDTO = Approval


// Shared SlaPolicy model (mirrors backend SlaPolicyDTO)
export interface SlaPolicy {
  slaPolicyId: string
  applicationId?: string
  name: string
  description?: string
  durationSeconds: number
  breachAction?: any
  version?: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
}

export type SlaPolicyDTO = SlaPolicy

// Shared Task model (mirrors backend JPA entity a.u.m.shared.tms.models.Task)
export interface Task {
  // corresponds to taskId (UUID)
  id: string

  applicationId?: string

  // type_key on backend
  typeKey: string

  title: string
  description?: string

  status?: string
  priority?: string

  // user ids
  reporterId?: string
  assigneeId?: string

  slaPolicyId?: string
  workflowInstanceId?: string

  dueDate?: string // ISO datetime

  // arbitrary JSON stored in metadata jsonb column
  metadata?: any

  createdBy?: string
  createdAt?: string
  updatedAt?: string

  deletedBy?: string
  deletedAt?: string

  version?: number
}

export type TaskDTO = Task


// Shared Workflow model (mirrors backend JPA entity a.u.m.shared.tms.models.Workflow)
export interface Workflow {
  // corresponds to workflowId (UUID)
  id: string

  // optional reference to application entity (UUID)
  applicationId?: string

  // required name
  name: string

  // optional description
  description?: string

  // JSON/string definition of the workflow (stored as jsonb on the backend)
  definition?: any

  // who created the workflow (UUID)
  createdBy?: string

  // ISO timestamp
  createdAt?: string

  // optimistic locking/version
  version?: number
}

export type WorkflowDTO = Workflow


// Shared WorkflowInstance model (mirrors backend JPA entity a.u.m.shared.tms.models.WorkflowInstance)
export interface WorkflowInstance {
  // corresponds to workflowInstanceId (UUID)
  id: string

  // parent workflow
  workflowId: string

  // optional human-friendly name/key
  name?: string
  key?: string

  // current state key or id depending on backend representation
  currentStateKey?: string
  currentStateId?: string

  // arbitrary JSON
  metadata?: any

  // audit fields
  createdBy?: string
  createdAt?: string
  updatedAt?: string

  version?: number
}

export type WorkflowInstanceDTO = WorkflowInstance

export interface WorkflowState {
  // mirrors WorkflowState.stateId -> id
  id?: string;
  workflowId?: string;
  key: string;
  name: string;
  metadata?: any; // stored as JSON/string in the backend
  createdBy?: string;
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

export type WorkflowStateDTO = WorkflowState;


export interface WorkflowTransition {
  id?: string; // transitionId
  workflowId?: string;
  name: string;
  fromStateId?: string;
  toStateId?: string;
  conditions?: any; // JSONB in backend
  actions?: any; // JSONB in backend
  metadata?: any; // JSONB in backend
  version?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WorkflowTransitionDTO = WorkflowTransition;

// --- Inventory Management (mock) ---
export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  categoryId?: string;
  locationId?: string;
  quantity: number;
  reorderLevel?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  delta: number; // positive for inbound, negative outbound
  reason?: string;
  createdAt: string;
  resultingQuantity?: number; // quantity after movement
}

// --- Point of Sale (mock) ---
export interface PosProduct {
  id: string;
  sku: string;
  name: string;
  priceCents: number; // price in cents to avoid float issues
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PosCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PosSaleItem {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface PosSale {
  id: string;
  customerId?: string;
  items: PosSaleItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: string;
}

// --- Tax Management (mock) ---
export interface TaxJurisdiction {
  id: string;
  code: string; // e.g. US-CA, EU-DE
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaxCategory {
  id: string;
  name: string;
  description?: string;
  defaultRatePercent: number; // fallback rate
  createdAt?: string;
  updatedAt?: string;
}

export interface TaxRule {
  id: string;
  name: string;
  jurisdictionId: string;
  categoryId?: string; // optional specific category override
  ratePercent: number; // e.g. 7.25
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaxTransactionLine {
  categoryId?: string;
  ruleId?: string; // explicit rule override
  amountCents: number;
  appliedRatePercent: number;
  taxCents: number;
}

export interface TaxTransaction {
  id: string;
  jurisdictionId: string;
  lines: TaxTransactionLine[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: string;
}

// --- Human Resources (HR) ---
export interface HrAttendanceRecord {
  id: string;
  userId: string;
  clockInAt: string; // ISO datetime
  clockOutAt?: string | null; // ISO datetime
  durationMinutes?: number; // computed total if closed
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HrShift {
  id: string;
  userId: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  role?: string;
  location?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

export interface HrVacationRequest {
  id: string;
  userId: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt?: string;
  updatedAt?: string;
}

export interface HrAvailabilitySlot {
  id: string;
  userId: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}