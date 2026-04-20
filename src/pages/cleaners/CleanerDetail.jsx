import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonTable } from '@/components/shared/SkeletonLoader';
import { getCleanerById, updateCleanerStatus } from '@/services/cleanersService';
import { formatDate, formatCurrency } from '@/lib/utils';

/**
 * CleanerDetail page — profile, performance stats, job history.
 */
export default function CleanerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cleaner, isLoading } = useQuery({
    queryKey: ['cleaner', id],
    queryFn: () => getCleanerById(id),
    enabled: !!id,
  });

  const toggleMutation = useMutation({
    mutationFn: () => updateCleanerStatus(id, cleaner.is_available ? 'busy' : 'available'),
    onSuccess: (data) => {
      toast.success(`Cleaner status updated`);
      queryClient.invalidateQueries({ queryKey: ['cleaner', id] });
      queryClient.invalidateQueries({ queryKey: ['cleaners'] });
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="max-w-4xl"><SkeletonTable rows={6} cols={3} /></div>;
  }

  if (!cleaner) {
    return <div className="text-center py-20 text-muted-foreground">Cleaner not found.</div>;
  }

  const completedJobs = (cleaner.bookings ?? []).filter((b) => b.status === 'completed');
  const totalEarned = completedJobs.reduce((sum, b) => sum + (b.total_amount || 0), 0);

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cleaners')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold">{cleaner.name}</h2>
            <p className="text-xs text-muted-foreground">{cleaner.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={cleaner.is_available ? 'success' : 'muted'}>
            {cleaner.is_available ? 'Available' : 'Busy/Away'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
          >
            {cleaner.is_available
              ? <><ToggleRight className="w-4 h-4" /> Set Busy</>
              : <><ToggleLeft className="w-4 h-4" /> Set Available</>
            }
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Rating', value: cleaner.rating ? `⭐ ${Number(cleaner.rating).toFixed(1)}` : '—' },
          { label: 'Total Jobs', value: cleaner.bookings?.length ?? 0 },
          { label: 'Completed', value: completedJobs.length },
          { label: 'Total Earned', value: formatCurrency(totalEarned) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Profile</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-muted-foreground">Email</p><p>{cleaner.email ?? '—'}</p></div>
          <div><p className="text-muted-foreground">Vehicle</p><p>{cleaner.vehicle ?? '—'}</p></div>
          <div><p className="text-muted-foreground">Joined</p><p>{formatDate(cleaner.created_at)}</p></div>
        </CardContent>
      </Card>

      {/* Leave calendar (simple list) */}
      {cleaner.leaves?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Upcoming Leaves</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cleaner.leaves.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between text-sm">
                <span>{formatDate(leave.date)}</span>
                <span className="text-muted-foreground">{leave.reason ?? 'No reason provided'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Job history */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Job History</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Scheduled', 'Customer', 'Service', 'Status', 'Total'].map((h) => (
                  <th key={h} className="h-10 px-4 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(cleaner.bookings ?? []).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No jobs yet</td></tr>
              ) : (
                (cleaner.bookings ?? []).map((b) => (
                  <tr key={b.id} className="border-b border-border hover:bg-muted/20">
                    <td className="px-4 py-3">{formatDate(b.scheduled_at)}</td>
                    <td className="px-4 py-3">{b.user?.name ?? '—'}</td>
                    <td className="px-4 py-3">{b.service?.name ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} type="booking" /></td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(b.total_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
