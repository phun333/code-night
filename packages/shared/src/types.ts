// User
export interface User {
  id: string;
  name: string;
  city: string;
}

// Resource
export type ResourceType = 'TECH_TEAM' | 'SUPPORT_AGENT';
export type ResourceStatus = 'AVAILABLE' | 'BUSY';

export interface Resource {
  id: string;
  resourceType: ResourceType;
  capacity: number;
  city: string;
  status: ResourceStatus;
}

// Request
export type Service = 'Superonline' | 'Paycell' | 'TV+';
export type RequestType = 'CONNECTION_ISSUE' | 'PAYMENT_PROBLEM' | 'STREAMING_ISSUE' | 'SPEED_COMPLAINT';
export type Urgency = 'HIGH' | 'MEDIUM' | 'LOW';
export type RequestStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED';

export interface Request {
  id: string;
  userId: string;
  service: Service;
  requestType: RequestType;
  urgency: Urgency;
  status: RequestStatus;
  createdAt: Date;
}

// Allocation
export type AllocationStatus = 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';

export interface Allocation {
  id: string;
  requestId: string;
  resourceId: string;
  priorityScore: number;
  status: AllocationStatus;
  timestamp: Date;
}

// Allocation Rule
export interface AllocationRule {
  id: string;
  condition: string;
  weight: number;
  isActive: boolean;
}

// API Request/Response types
export interface CreateRequestInput {
  userId: string;
  service: Service;
  requestType: RequestType;
  urgency: Urgency;
}

export interface DashboardSummary {
  pendingRequests: number;
  activeAllocations: number;
  resourceUtilization: {
    resourceId: string;
    resourceType: ResourceType;
    city: string;
    capacity: number;
    used: number;
    percentage: number;
  }[];
  recentAllocations: Allocation[];
  priorityQueue: (Request & { priorityScore: number })[];
}

// WebSocket Events
export type WebSocketEvents = {
  'request:new': Request;
  'allocation:new': Allocation;
  'resource:updated': Resource;
  'dashboard:refresh': void;
};
