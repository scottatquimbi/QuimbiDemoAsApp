// Enhanced database client stub for demo mode with GCP-compatible methods

export interface DatabaseClient {
  query: (sql: string, params?: any[]) => Promise<any[]>;
  insert: (table: string, data: any) => Promise<string>;
  update: (table: string, id: string, data: any) => Promise<void>;
  getCompensationRequests: (clientId: string, filters?: any) => Promise<any[]>;
  createSupportSession: (clientId: string, sessionData: any) => Promise<string>;
  createCompensationRequest: (clientId: string, requestData: any) => Promise<string>;
}

// Enhanced stub database client for demo mode
export const databaseClient: DatabaseClient = {
  async query(sql: string, params?: any[]) {
    console.log('🗄️  Database query (demo mode):', { sql, params });
    return [];
  },

  async insert(table: string, data: any) {
    console.log('📝 Database insert (demo mode):', { table, data });
    return `demo_${Date.now()}`;
  },

  async update(table: string, id: string, data: any) {
    console.log('✏️  Database update (demo mode):', { table, id, data });
  },

  async getCompensationRequests(clientId: string, filters?: any) {
    console.log('💰 Get compensation requests (demo mode):', { clientId, filters });
    return [];
  },

  async createSupportSession(clientId: string, sessionData: any) {
    console.log('📞 Create support session (demo mode):', { clientId, sessionData });
    return `session_${Date.now()}`;
  },

  async createCompensationRequest(clientId: string, requestData: any) {
    console.log('💰 Create compensation request (demo mode):', { clientId, requestData });
    return `comp_req_${Date.now()}`;
  }
};

// Legacy export for compatibility
export const gcpDatabaseClient = databaseClient;