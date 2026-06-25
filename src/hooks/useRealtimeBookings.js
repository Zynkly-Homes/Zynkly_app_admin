import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Hook: subscribes to real-time booking changes via Supabase Realtime.
 * Automatically invalidates React Query 'bookings' cache on INSERT/UPDATE/DELETE.
 * 
 * Call this once at the layout level (DashboardLayout) so the subscription
 * is active for the entire admin session.
 */
export function useRealtimeBookings() {
  const queryClient = useQueryClient();

  const handleBookingChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime:bookings')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
        },
        handleBookingChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleBookingChange]);
}
