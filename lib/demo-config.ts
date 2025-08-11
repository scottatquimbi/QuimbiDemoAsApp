/**
 * Demo Configuration Management
 * Handles environment-based routing and demo mode detection
 */

// Environment-based configuration
export const DEMO_CONFIG = {
  // Enable demo mode based on environment
  DEMO_ENABLED: process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true',
  
  // Demo API endpoints
  DEMO_SEED_ENDPOINT: '/api/demo-seed-isolated',
  
  // Demo routes
  DEMO_ROUTES: ['/demo', '/demo-scenarios'],
  
  // Demo localStorage key
  DEMO_STORAGE_KEY: 'demoScenario',
  
  // Demo client ID for analytics
  DEMO_CLIENT_ID: 'demo-client-isolated',
  
  // Demo features
  FEATURES: {
    SCENARIO_SELECTION: true,
    MOCK_EXTERNAL_CONTENT: true,
    SIMULATED_CONVERSATIONS: true,
    SAMPLE_ANALYTICS: true,
    AUTO_COMPENSATION: true
  }
};

/**
 * Check if we're currently in demo mode
 */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check environment
    return DEMO_CONFIG.DEMO_ENABLED;
  }
  
  // Client-side: check URL params and localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const hasDemoParam = urlParams.get('demo') === 'true';
  const hasDemoData = localStorage.getItem(DEMO_CONFIG.DEMO_STORAGE_KEY) !== null;
  
  return DEMO_CONFIG.DEMO_ENABLED && (hasDemoParam || hasDemoData);
}

/**
 * Check if current route is demo-related
 */
export function isDemoRoute(pathname: string): boolean {
  return DEMO_CONFIG.DEMO_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Get demo scenario data from localStorage
 */
export function getDemoScenarioData(): any | null {
  if (typeof window === 'undefined' || !DEMO_CONFIG.DEMO_ENABLED) {
    return null;
  }
  
  try {
    const data = localStorage.getItem(DEMO_CONFIG.DEMO_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading demo scenario data:', error);
    return null;
  }
}

/**
 * Store demo scenario data in localStorage
 */
export function setDemoScenarioData(data: any): void {
  if (typeof window === 'undefined' || !DEMO_CONFIG.DEMO_ENABLED) {
    return;
  }
  
  try {
    localStorage.setItem(DEMO_CONFIG.DEMO_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing demo scenario data:', error);
  }
}

/**
 * Clear demo scenario data
 */
export function clearDemoScenarioData(): void {
  if (typeof window === 'undefined' || !DEMO_CONFIG.DEMO_ENABLED) {
    return;
  }
  
  try {
    localStorage.removeItem(DEMO_CONFIG.DEMO_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing demo scenario data:', error);
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    isDemoMode: isDemoMode(),
    demoEnabled: DEMO_CONFIG.DEMO_ENABLED,
    environment: process.env.NODE_ENV,
    features: DEMO_CONFIG.FEATURES
  };
}

/**
 * Demo mode detection for server-side components
 */
export function getDemoModeFromRequest(searchParams: URLSearchParams): boolean {
  if (!DEMO_CONFIG.DEMO_ENABLED) {
    return false;
  }
  
  return searchParams.get('demo') === 'true';
}

/**
 * Validate demo configuration
 */
export function validateDemoConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (DEMO_CONFIG.DEMO_ENABLED) {
    // Check if demo routes are accessible
    if (!DEMO_CONFIG.DEMO_ROUTES.length) {
      errors.push('No demo routes configured');
    }
    
    // Check if demo endpoint is configured
    if (!DEMO_CONFIG.DEMO_SEED_ENDPOINT) {
      errors.push('Demo seed endpoint not configured');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}