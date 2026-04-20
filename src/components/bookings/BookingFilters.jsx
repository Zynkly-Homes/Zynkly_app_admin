import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BOOKING_STATUS, BOOKING_STATUS_LABELS } from '@/lib/constants';

/**
 * BookingFilters — filter bar for the bookings list.
 * 
 * Props:
 *   filters         — current filter values
 *   onFiltersChange — callback(newFilters)
 */
export function BookingFilters({ filters, onFiltersChange }) {
  const [localSearch, setLocalSearch] = useState(filters.search ?? '');

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      onFiltersChange({ ...filters, search: localSearch });
    }
  };

  const handleSearchClick = () => {
    onFiltersChange({ ...filters, search: localSearch });
  };

  const handleStatus = (value) => {
    onFiltersChange({ ...filters, status: value === 'all' ? '' : value });
  };

  const clearFilters = () => {
    setLocalSearch('');
    onFiltersChange({});
  };

  const hasActiveFilters = filters.status || filters.search || filters.from || filters.to;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="booking-search"
          className="pl-9"
          placeholder="Search bookings..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      {/* Status filter */}
      <Select value={filters.status || 'all'} onValueChange={handleStatus}>
        <SelectTrigger className="w-40" id="booking-status-filter">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range — from */}
      <Input
        id="booking-date-from"
        type="date"
        className="w-36"
        value={filters.from ?? ''}
        onChange={(e) => onFiltersChange({ ...filters, from: e.target.value })}
        title="From date"
      />

      <span className="text-muted-foreground text-sm">to</span>

      {/* Date range — to */}
      <Input
        id="booking-date-to"
        type="date"
        className="w-36"
        value={filters.to ?? ''}
        onChange={(e) => onFiltersChange({ ...filters, to: e.target.value })}
        title="To date"
      />

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
          <X className="w-3.5 h-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
