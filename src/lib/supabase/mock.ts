
// Basic Mock Supabase Client for verifying UI flows without backend
export class MockSupabaseClient {
    auth = {
        getUser: async () => {
            return {
                data: {
                    user: {
                        id: 'mock-user-id',
                        email: 'dev@example.com',
                        user_metadata: { full_name: 'Dev User' }
                    }
                },
                error: null
            };
        },
        getSession: async () => ({
            data: {
                session: {
                    user: {
                        id: 'mock-user-id',
                        email: 'dev@example.com',
                        user_metadata: { full_name: 'Dev User' }
                    }
                }
            },
            error: null
        }),
        onAuthStateChange: (callback: any) => {
            // Immediately fire with the mock user session
            setTimeout(() => {
                callback('SIGNED_IN', {
                    user: {
                        id: 'mock-user-id',
                        email: 'dev@example.com',
                        user_metadata: { full_name: 'Dev User' }
                    }
                });
            }, 0);
            return { data: { subscription: { unsubscribe: () => { } } } };
        },
        signInWithPassword: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
        signUp: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
        signOut: async () => ({ error: null }),
        updateUser: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
    };

    private storage = new Map<string, any[]>();

    constructor() {
        // Seed some data
        this.storage.set('projects', []);
        this.storage.set('stages', []);
        this.storage.set('checklist_items', []);
        this.storage.set('variations', []);
    }

    from(table: string) {
        return new MockQueryBuilder(table, this.storage);
    }
}

class MockQueryBuilder {
    constructor(private table: string, private storage: Map<string, any[]>) { }

    select(columns: string = '*') {
        return this;
    }

    insert(data: any | any[]) {
        const items = Array.isArray(data) ? data : [data];
        const current = this.storage.get(this.table) || [];

        const newItems = items.map((item: any) => ({
            ...item,
            id: item.id || Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString()
        }));

        return {
            data: newItems,
            error: null,
            select: () => ({
                data: newItems,
                error: null,
                single: () => ({ data: newItems[0], error: null })
            }),
            single: () => ({ data: newItems[0], error: null })
        };
    }

    update(data: any) {
        return {
            eq: () => ({ data: null, error: null }),
            data: null,
            error: null,
        };
    }

    delete() {
        return {
            eq: () => ({ data: null, error: null }),
            in: () => ({ data: null, error: null }),
            data: null,
            error: null,
        };
    }

    upsert(data: any, options?: any) {
        const items = Array.isArray(data) ? data : [data];
        return { data: items, error: null };
    }

    eq(column: string, value: any) {
        return this;
    }

    in(column: string, values: any[]) {
        return this;
    }

    limit(count: number) {
        return this;
    }

    single() {
        return { data: this.getMockDataForTable(this.table), error: null };
    }

    maybeSingle() {
        return { data: this.getMockDataForTable(this.table), error: null };
    }

    order() { return this; }

    then(callback: (res: any) => void) {
        const res = { data: [this.getMockDataForTable(this.table)], error: null };
        return callback(res);
    }

    private getMockDataForTable(table: string) {
        if (table === 'projects') return {
            id: 'mock-project-1',
            name: 'Mock Project: Dream Home',
            builder_name: 'Mock Builder',
            status: 'active',
            address: '123 Mock St',
            contract_value: 500000,
            start_date: '2026-01-01',
            created_at: new Date().toISOString()
        };
        if (table === 'stages') return {
            id: 'mock-stage-1',
            name: 'Pre-Slab',
            status: 'completed',
            checklist_items: [
                { id: '1', description: 'Site Scrape', is_completed: true },
                { id: '2', description: 'Plumbing', is_completed: false }
            ]
        };
        if (table === 'variations') return {
            id: 'v1',
            title: 'Extra Power Points',
            additional_cost: 500,
            status: 'approved',
            created_at: new Date().toISOString()
        };
        return {};
    }
}
