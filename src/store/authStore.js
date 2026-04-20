import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { getAdminRecord } from '../lib/auth';

/**
 * Zustand store for authentication state.
 *
 * State shape:
 *   session  — Supabase session object
 *   admin    — Row from admins table (includes role)
 *   loading  — True during initial auth check
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      session: null,
      admin: null,
      loading: true,
      otpPending: false,


      /**
       * Initialize auth: subscribe to Supabase session changes.
       * Call this once in App.jsx on mount.
       */
      initialize: async () => {
        set({ loading: true });

        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const admin = await getAdminRecord(
            session.user.id,
            session.user.email,  // pass email for fallback lookup
          );
          set({ session, admin, loading: false });
        } else {
          set({ session: null, admin: null, loading: false });
        }

        // Subscribe to auth changes (token refresh, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (get().otpPending) return;

            if (event === 'SIGNED_OUT' || !session) {
              set({ session: null, admin: null, loading: false });
              return;
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              const admin = await getAdminRecord(
                session.user.id,
                session.user.email,
              );
              set({ session, admin, loading: false });
            }
          }
        );

        return () => subscription.unsubscribe();
      },

      /**
       * Sign in with email/password.
       * Initiates 2-step verification by sending an OTP after successful password check.
       */
      signIn: async (email, password) => {
        set({ otpPending: true });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          set({ otpPending: false });
          return { error };
        }

        // Pass both userId AND email for resilient lookup
        const admin = await getAdminRecord(data.session.user.id, email);

        if (!admin) {
          await supabase.auth.signOut();
          set({ otpPending: false });
          return {
            error: {
              message:
                'Your account exists but is not in the admin panel. ' +
                'Ask a super admin to add you, or check Supabase → admins table.',
            },
          };
        }

        // Sign out to invalidate password-only session
        await supabase.auth.signOut();

        // Send OTP
        const { error: otpError } = await supabase.auth.signInWithOtp({ email });
        if (otpError) {
          set({ otpPending: false });
          return { error: otpError };
        }

        return { error: null, requireOtp: true };
      },

      /**
       * Verify OTP to finalize login.
       */
      verifyOtp: async (email, token) => {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        });

        if (error) return { error };

        const admin = await getAdminRecord(data.session.user.id, email);
        if (!admin) {
          await supabase.auth.signOut();
          set({ otpPending: false });
          return { error: { message: 'Admin record not found.' } };
        }

        set({ session: data.session, admin, otpPending: false });
        return { error: null };
      },

      /**
       * Cancel OTP workflow and revert.
       */
      cancelOtp: () => {
        set({ otpPending: false });
      },

      /**
       * Sign out.
       */
      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, admin: null });
      },

      /**
       * Send password reset email.
       */
      sendPasswordReset: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        return { error };
      },

      /**
       * Refresh admin record from DB (e.g. after role change).
       */
      refreshAdmin: async () => {
        const session = get().session;
        if (!session) return;
        const admin = await getAdminRecord(session.user.id, session.user.email);
        set({ admin });
      },
    }),
    {
      name: 'zynkly-admin-auth',
      // Only persist session — admin is re-fetched on each auth state change
      partialize: (state) => ({ session: state.session }),
    }
  )
);

export default useAuthStore;
