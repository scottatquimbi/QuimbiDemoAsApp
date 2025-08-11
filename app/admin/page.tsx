'use client';

import { useState, useEffect } from 'react';
import { Customer, CUSTOMER_TIERS } from '@/lib/billing';
import Header from '@/app/components/Header';

interface UsageStats {
  customerId: string;
  period: string;
  totalTokens: number;
  totalCost: number;
  providerCosts: number;
  margin: number;
  requestCount: number;
  features: Record<string, { tokens: number; cost: number }>;
  providers: Record<string, { tokens: number; cost: number }>;
}

export default function AdminDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'customers' | 'usage' | 'providers' | 'billing'>('customers');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async (customerId: string) => {
    try {
      const response = await fetch(`/api/billing/usage?customerId=${customerId}&period=month`);
      const data = await response.json();
      if (data.success) {
        setUsageStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const createCustomer = async (customerData: Partial<Customer>) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      const data = await response.json();
      if (data.success) {
        await loadCustomers();
        return data.customer;
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customerId, ...updates })
      });
      const data = await response.json();
      if (data.success) {
        await loadCustomers();
        return data.customer;
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />
      
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Enterprise Admin Dashboard</h1>
            <div className="flex space-x-4">
              <span className="text-sm text-gray-500">{customers.length} customers</span>
              <span className="text-sm text-gray-500">
                {customers.filter(c => c.status === 'active').length} active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'customers', name: 'Customers' },
              { id: 'usage', name: 'Usage Analytics' },
              { id: 'providers', name: 'AI Providers' },
              { id: 'billing', name: 'Billing' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === 'customers' && (
          <CustomersTab 
            customers={customers} 
            onCreateCustomer={createCustomer}
            onUpdateCustomer={updateCustomer}
            onSelectCustomer={(customer) => {
              setSelectedCustomer(customer);
              loadUsageStats(customer.id);
            }}
          />
        )}

        {activeTab === 'usage' && (
          <UsageTab 
            customers={customers}
            selectedCustomer={selectedCustomer}
            usageStats={usageStats}
            onSelectCustomer={(customer) => {
              setSelectedCustomer(customer);
              loadUsageStats(customer.id);
            }}
          />
        )}

        {activeTab === 'providers' && <ProvidersTab />}
        {activeTab === 'billing' && <BillingTab customers={customers} />}
      </div>
    </div>
  );
}

// Customers Tab Component
function CustomersTab({ 
  customers, 
  onCreateCustomer, 
  onUpdateCustomer, 
  onSelectCustomer 
}: {
  customers: Customer[];
  onCreateCustomer: (data: Partial<Customer>) => Promise<Customer | undefined>;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => Promise<Customer | undefined>;
  onSelectCustomer: (customer: Customer) => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState<{
    name: string;
    email: string;
    tier: string;
    billingPeriod: 'monthly' | 'yearly';
  }>({
    name: '',
    email: '',
    tier: 'professional',
    billingPeriod: 'monthly'
  });

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = await onCreateCustomer(newCustomer);
    if (customer) {
      setShowCreateForm(false);
      setNewCustomer({ name: '', email: '', tier: 'professional', billingPeriod: 'monthly' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Customer Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Customer Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Customer
        </button>
      </div>

      {/* Create Customer Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Create New Customer</h3>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tier</label>
                <select
                  value={newCustomer.tier}
                  onChange={(e) => setNewCustomer({ ...newCustomer, tier: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {Object.entries(CUSTOMER_TIERS).map(([id, tier]) => (
                    <option key={id} value={id}>{tier}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Billing Period</label>
                <select
                  value={newCustomer.billingPeriod}
                  onChange={(e) => setNewCustomer({ ...newCustomer, billingPeriod: e.target.value as 'monthly' | 'yearly' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Customer
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Customers ({customers.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {CUSTOMER_TIERS[customer.tier as keyof typeof CUSTOMER_TIERS] || customer.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.status === 'active' ? 'bg-green-100 text-green-800' :
                      customer.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {customer.currentMonthUsage?.toLocaleString() || 0} tokens
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onSelectCustomer(customer)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Usage Analytics Tab
function UsageTab({ 
  customers, 
  selectedCustomer, 
  usageStats, 
  onSelectCustomer 
}: {
  customers: Customer[];
  selectedCustomer: Customer | null;
  usageStats: UsageStats | null;
  onSelectCustomer: (customer: Customer) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Usage Analytics</h2>
      
      {/* Customer Selector */}
      <div className="bg-white p-6 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
        <select
          value={selectedCustomer?.id || ''}
          onChange={(e) => {
            const customer = customers.find(c => c.id === e.target.value);
            if (customer) onSelectCustomer(customer);
          }}
          className="block w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Choose a customer...</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} ({CUSTOMER_TIERS[customer.tier as keyof typeof CUSTOMER_TIERS]})
            </option>
          ))}
        </select>
      </div>

      {/* Usage Statistics */}
      {usageStats && selectedCustomer && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Tokens</h3>
            <p className="text-2xl font-bold text-gray-900">{usageStats.totalTokens.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Customer Cost</h3>
            <p className="text-2xl font-bold text-green-600">${usageStats.totalCost.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Provider Cost</h3>
            <p className="text-2xl font-bold text-red-600">${usageStats.providerCosts.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Margin</h3>
            <p className="text-2xl font-bold text-blue-600">${usageStats.margin.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// AI Providers Tab
function ProvidersTab() {
  const [providerHealth, setProviderHealth] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkProviderHealth();
  }, []);

  const checkProviderHealth = async () => {
    try {
      const response = await fetch('/api/ai/generate');
      const data = await response.json();
      if (data.success) {
        setProviderHealth(data.health);
      }
    } catch (error) {
      console.error('Error checking provider health:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">AI Provider Status</h2>
        <button
          onClick={checkProviderHealth}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(providerHealth).map(([provider, healthy]) => (
          <div key={provider} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{provider}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {healthy ? 'Healthy' : 'Error'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Billing Tab
function BillingTab({ customers }: { customers: Customer[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Billing Overview</h2>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Monthly Revenue Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">$12,450</p>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">$4,150</p>
            <p className="text-sm text-gray-500">Provider Costs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">$8,300</p>
            <p className="text-sm text-gray-500">Net Profit</p>
          </div>
        </div>
      </div>
    </div>
  );
} 