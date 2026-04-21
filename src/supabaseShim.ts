type SupabaseResult<T = any> = Promise<{ data: T; error: any }>;

const stubQuery = () => {
  const chain = {
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: [], error: null }),
    update: async () => ({ data: [], error: null }),
    delete: async () => ({ data: [], error: null }),
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    range: () => chain,
    set: () => chain,
    on: () => chain,
    from: () => chain,
  };
  return chain;
};

const supabaseStub: any = {
  from: () => stubQuery(),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: "" }, error: null }),
      remove: async () => ({ data: null, error: null }),
    }),
  },
  channel: () => ({
    on: () => ({ subscribe: async () => ({}) }),
  }),
  removeChannel: () => {},
  auth: {
    signInWithPassword: async () => ({ data: null, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    setSession: async () => ({ data: null, error: null }),
  },
};

if (typeof window !== 'undefined') {
  (window as any).supabase = supabaseStub;
}

export const supabase = supabaseStub;
