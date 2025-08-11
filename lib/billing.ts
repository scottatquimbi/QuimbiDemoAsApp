// Minimal billing stub for admin panel compatibility

export interface Customer {
  id: string;
  name: string;
  email: string;
  tier: string;
  status: string;
  createdAt: string;
  isActive: boolean;
  currentMonthUsage?: number;
}

export const CUSTOMER_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
} as const;

// Stub functions - admin functionality disabled in demo mode
export async function getCustomers(): Promise<Customer[]> {
  console.warn('Admin functionality disabled in Ollama-only demo mode');
  return [];
}

export async function updateCustomerTier(customerId: string, tier: string): Promise<void> {
  console.warn('Admin functionality disabled in Ollama-only demo mode');
}

export async function getUsageStats(customerId?: string) {
  console.warn('Admin functionality disabled in Ollama-only demo mode');
  return {
    totalTokens: 0,
    totalRequests: 0,
    totalCost: 0
  };
}