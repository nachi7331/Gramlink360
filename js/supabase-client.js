/**
 * ============================================================================
 * GRAMLINK 360 - Official Supabase JS SDK Connector & Service Bridge
 * ============================================================================
 * Uses @supabase/supabase-js v2 with PostgreSQL Row Level Security (RLS).
 * Reads configuration from window.GRAMLINK_CONFIG.
 * Exposes both namespaced (GramlinkAPI.auth, GramlinkAPI.complaints, etc.)
 * and flat convenience methods on window.GramlinkAPI & window.GramlinkSupabase.
 */

(function () {
  const config = window.GRAMLINK_CONFIG || {};
  const url = config.SUPABASE_URL;
  const anonKey = config.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('❌ Gramlink 360: Missing Supabase credentials in window.GRAMLINK_CONFIG');
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('❌ Gramlink 360: Supabase JS SDK not loaded. Ensure CDN script is present before this file.');
    return;
  }

  // Initialize official Supabase client with local persistence for auth sessions
  const client = window.supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'gramlink_supabase_auth_token'
    }
  });

  console.log('✅ Gramlink 360: Supabase client initialized successfully with publishable key.');

  // Helper: Format database and auth errors into user-friendly messages
  function formatError(error, defaultMsg = 'An unexpected database error occurred.') {
    if (!error) return defaultMsg;
    console.error('Database/Auth Error Details:', error);

    const msg = error.message || error.msg || (typeof error === 'string' ? error : '');
    const code = error.code || error.error_code || '';

    if (code === '42501' || msg.includes('row-level security') || msg.includes('violates row-level security')) {
      return 'Permission Denied: Your account role does not have permission to perform this action (enforced by PostgreSQL Row Level Security).';
    }
    if (code === 'email_not_confirmed' || msg.toLowerCase().includes('email not confirmed')) {
      return 'Email Not Confirmed: Please verify your email via the link sent to your inbox, or disable "Confirm email" in Supabase Auth settings for instant access.';
    }
    if (msg.includes('Invalid login credentials') || code === 'invalid_credentials') {
      return 'Incorrect email or password. Please verify your credentials and try again.';
    }
    if (msg.includes('duplicate key value') || code === '23505') {
      return 'A record with this identifier or reference token already exists.';
    }
    if (code === 'PGRST116' || msg.includes('JSON object requested, multiple (or no) rows returned')) {
      return 'Requested record was not found.';
    }
    if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
      return 'Network Error: Unable to reach the Supabase database. Please check your internet connection.';
    }
    if (msg.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }

    return msg || defaultMsg;
  }

  // Unified API Service
  const api = {
    client: client,

    // ========================================================================
    // 1. AUTHENTICATION & SESSION HANDLING
    // ========================================================================
    auth: {
      signUp: async ({ email, password, fullName, phone, ward }) => {
        try {
          const cleanEmail = (email || '').trim().toLowerCase();
          const cleanPass = password || '';

          const { data, error } = await client.auth.signUp({
            email: cleanEmail,
            password: cleanPass,
            options: {
              data: {
                full_name: (fullName || '').trim(),
                phone: (phone || '').trim(),
                ward_no: ward || 'Ward 2 - Shivaji Chowk'
              }
            }
          });

          if (error) throw error;

          const needsEmailVerification = !data.session && Boolean(data.user);
          return {
            data: {
              user: data.user,
              session: data.session,
              needsEmailVerification
            },
            error: null
          };
        } catch (err) {
          return { data: null, error: formatError(err, 'Failed to create resident account.') };
        }
      },

      signIn: async ({ email, password }) => {
        try {
          const cleanEmail = (email || '').trim().toLowerCase();
          const cleanPass = password || '';

          const { data, error } = await client.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass
          });

          if (error) throw error;

          // Fetch user profile from public.profiles
          let profile = null;
          try {
            const { data: prof, error: profileErr } = await client
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            if (!profileErr && prof) {
              profile = prof;
            } else {
              // Fallback to user_metadata if trigger hasn't completed or profile is pending
              profile = {
                id: data.user.id,
                full_name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
                phone: data.user.user_metadata?.phone || '',
                ward_no: data.user.user_metadata?.ward_no || 'Ward 2 - Shivaji Chowk',
                role: 'resident'
              };
            }
          } catch (pe) {
            console.warn('Profile fetch notice:', pe);
          }

          return {
            data: {
              session: data.session,
              user: data.user,
              profile: profile
            },
            error: null
          };
        } catch (err) {
          return { data: null, error: formatError(err, 'Sign in failed.') };
        }
      },

      signOut: async () => {
        try {
          const { error } = await client.auth.signOut();
          if (error) throw error;
          return { error: null };
        } catch (err) {
          return { error: formatError(err, 'Sign out failed.') };
        }
      },

      getSession: async () => {
        try {
          const { data: { session }, error } = await client.auth.getSession();
          if (error) throw error;
          if (!session || !session.user) {
            return { session: null, user: null, profile: null };
          }

          let profile = null;
          try {
            const { data: prof } = await client
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (prof) {
              profile = prof;
            } else {
              profile = {
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Resident',
                phone: session.user.user_metadata?.phone || '',
                ward_no: session.user.user_metadata?.ward_no || 'Ward 2 - Shivaji Chowk',
                role: 'resident'
              };
            }
          } catch (pe) {
            console.warn('Could not read user profile:', pe);
          }

          return { session, user: session.user, profile };
        } catch (err) {
          console.warn('Session verification notice:', err);
          return { session: null, user: null, profile: null };
        }
      },

      getUser: async () => {
        try {
          const { data: { user }, error } = await client.auth.getUser();
          if (error) throw error;
          return { user, error: null };
        } catch (err) {
          return { user: null, error: formatError(err) };
        }
      },

      onAuthStateChange: (callback) => {
        return client.auth.onAuthStateChange(callback);
      }
    },

    // ========================================================================
    // 2. SERVICES DIRECTORY
    // ========================================================================
    services: {
      list: async (category = 'all', searchQuery = '') => {
        try {
          let query = client
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('title', { ascending: true });

          if (category && category !== 'all') {
            query = query.eq('category', category);
          }

          if (searchQuery && searchQuery.trim()) {
            query = query.ilike('title', `%${searchQuery.trim()}%`);
          }

          const { data, error } = await query;
          if (error) throw error;
          return { data: data || [], error: null };
        } catch (err) {
          return { data: [], error: formatError(err, 'Failed to load village services.') };
        }
      }
    },

    // ========================================================================
    // 3. ANNOUNCEMENTS & GRAM SABHA
    // ========================================================================
    announcements: {
      list: async (category = 'all', searchQuery = '') => {
        try {
          let query = client
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

          if (category && category !== 'all') {
            query = query.eq('category', category);
          }

          if (searchQuery && searchQuery.trim()) {
            query = query.ilike('title', `%${searchQuery.trim()}%`);
          }

          const { data, error } = await query;
          if (error) throw error;
          return { data: data || [], error: null };
        } catch (err) {
          return { data: [], error: formatError(err, 'Failed to load announcements.') };
        }
      },

      create: async ({ title, category, venue, description, isUrgent, eventDate, eventTime, author }) => {
        try {
          const { data: { user } } = await client.auth.getUser();
          if (!user) {
            throw new Error('Authentication Required: Only authorized administrators can publish village notices.');
          }

          const payload = {
            title: (title || '').trim(),
            category: category || 'General',
            venue: (venue || '').trim() || 'Gram Panchayat Office',
            description: (description || '').trim(),
            is_urgent: Boolean(isUrgent),
            event_date: eventDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            event_time: eventTime || '10:00 AM',
            author_designation: author || 'Sarpanch Sunita Deshmukh',
            created_by: user.id
          };

          const { data, error } = await client
            .from('announcements')
            .insert([payload])
            .select()
            .single();

          if (error) throw error;
          return { data, error: null };
        } catch (err) {
          return { data: null, error: formatError(err, 'Failed to broadcast announcement.') };
        }
      }
    },

    // ========================================================================
    // 4. COMPLAINTS & GRIEVANCE REDRESSAL (SLA ENGINE)
    // ========================================================================
    complaints: {
      create: async (formData) => {
        try {
          const { data: { user } } = await client.auth.getUser();
          if (!user) {
            throw new Error('Authentication Required: You must be signed in as an authenticated resident to lodge an official complaint in the database (enforced by Row Level Security).');
          }

          // Generate reference token conforming to regex: ^GL-[0-9]{4}-[0-9]{4}$
          const currentYear = new Date().getFullYear();
          const suffix = Math.floor(1000 + Math.random() * 9000);
          const referenceToken = `GL-${currentYear}-${suffix}`;

          const payload = {
            reference_token: referenceToken,
            citizen_id: user.id,
            category: formData.category || 'general',
            title: (formData.title || '').trim(),
            description: (formData.description || '').trim(),
            ward_no: formData.ward || 'Ward 2 - Shivaji Chowk',
            applicant_name: (formData.applicantName || '').trim(),
            applicant_phone: (formData.applicantPhone || '').trim(),
            priority: formData.priority || 'Medium',
            status: 'Pending',
            geo_coordinates: formData.geoCoordinates || null
          };

          const { data, error } = await client
            .from('complaints')
            .insert([payload])
            .select()
            .single();

          if (error) throw error;
          return { data, error: null };
        } catch (err) {
          return { data: null, error: formatError(err, 'Failed to lodge grievance.') };
        }
      },

      getByToken: async (token) => {
        try {
          const clean = (token || '').trim().toUpperCase();
          if (!clean) {
            return { data: null, error: 'Please enter a valid reference token.' };
          }

          const { data, error } = await client
            .from('complaints')
            .select('*, complaint_status_history(*)')
            .eq('reference_token', clean)
            .maybeSingle();

          if (error) throw error;
          if (!data) {
            return { data: null, error: `No grievance found with reference token "${clean}".` };
          }

          return { data, error: null };
        } catch (err) {
          return { data: null, error: formatError(err, 'Failed to fetch grievance record.') };
        }
      },

      listForResident: async () => {
        try {
          const { data: { user } } = await client.auth.getUser();
          if (!user) {
            return { data: [], error: 'Not authenticated' };
          }

          // RLS ensures only complaints with citizen_id = auth.uid() are returned
          const { data, error } = await client
            .from('complaints')
            .select('*')
            .eq('citizen_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return { data: data || [], error: null };
        } catch (err) {
          return { data: [], error: formatError(err, 'Failed to load your complaints from Supabase.') };
        }
      },

      listAllForAdmin: async (statusFilter = 'all') => {
        try {
          let query = client
            .from('complaints')
            .select('*')
            .order('created_at', { ascending: false });

          if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
          }

          const { data, error } = await query;
          if (error) throw error;
          return { data: data || [], error: null };
        } catch (err) {
          return { data: [], error: formatError(err, 'Failed to load complaints table from Supabase.') };
        }
      },

      updateStatus: async (token, newStatus, resolutionNotes) => {
        try {
          const cleanToken = (token || '').trim().toUpperCase();
          const payload = {
            status: newStatus,
            resolution_notes: resolutionNotes || `Status updated to ${newStatus}`
          };

          if (newStatus === 'Resolved') {
            payload.resolved_at = new Date().toISOString();
          }

          const { data, error } = await client
            .from('complaints')
            .update(payload)
            .eq('reference_token', cleanToken)
            .select()
            .single();

          if (error) throw error;
          return { data, error: null };
        } catch (err) {
          return { data: null, error: formatError(err, 'Failed to update grievance status.') };
        }
      }
    }
  };

  // Flat helper methods for complete backwards compatibility across scripts
  api.signUp = api.auth.signUp;
  api.signIn = api.auth.signIn;
  api.signOut = api.auth.signOut;
  api.getSession = api.auth.getSession;
  api.getUser = api.auth.getUser;
  api.createComplaint = api.complaints.create;
  api.fetchComplaintByToken = api.complaints.getByToken;
  api.getComplaintByToken = api.complaints.getByToken;
  api.updateComplaintStatus = api.complaints.updateStatus;
  api.listResidentComplaints = api.complaints.listForResident;
  api.listAdminComplaints = api.complaints.listAllForAdmin;
  api.getServices = api.services.list;
  api.getAnnouncements = api.announcements.list;
  api.createAnnouncement = api.announcements.create;

  // Mount to window
  window.GramlinkAPI = api;
  window.GramlinkSupabase = api;
})();
