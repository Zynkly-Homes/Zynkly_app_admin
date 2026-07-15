import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBookings,
  getBookingById,
  updateBookingStatus,
  assignCleaner,
} from '../services/bookingsService';

/**
 * Hook: paginated bookings list with filters.
 */
export function useBookings(filters = {}, page = 0, pageSize = 20) {
  return useQuery({
    queryKey: ['bookings', filters, page, pageSize],
    queryFn: () => getBookings({ filters, page, pageSize }),
    keepPreviousData: true,
  });
}

/**
 * Hook: single booking by ID.
 */
export function useBooking(id) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingById(id),
    enabled: !!id,
  });
}

/**
 * Hook: mutation to update booking status.
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => updateBookingStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
  });
}

/**
 * Hook: mutation to assign a cleaner to a booking.
 */
export function useAssignCleaner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, cleanerId }) => assignCleaner(bookingId, cleanerId),
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
}
