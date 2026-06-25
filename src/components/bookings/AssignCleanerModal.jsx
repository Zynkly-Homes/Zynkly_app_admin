import { useState, useEffect, useRef } from 'react';
import { UserCheck, Loader2, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getAvailableCleaners } from '@/services/cleanersService';

/**
 * AssignCleanerPanel — right-side sliding panel for selecting an available cleaner.
 *
 * Cleaners on leave for the booking date are excluded entirely.
 * Cleaners with a conflicting booking (±2h) are shown with a red "Busy" badge
 * and a reason — but the admin can still select and assign them (warning-only).
 *
 * Props:
 *   open          — boolean
 *   onClose       — close callback
 *   booking       — booking object (needs id, scheduled_at, cleaner_id)
 *   onAssign      — callback(cleanerId) triggered on confirm
 *   isAssigning   — loading state for optimistic UX
 */
export function AssignCleanerModal({ open, onClose, booking, onAssign, isAssigning }) {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open || !booking) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setSearch('');
    // Pass booking.id so the current booking is excluded from the overlap check
    getAvailableCleaners(booking.scheduled_at, booking.id)
      .then(setCleaners)
      .catch(console.error)
      .finally(() => setLoading(false));
    setSelected(booking.cleaner_id ?? null);
  }, [open, booking, booking?.scheduled_at, booking?.cleaner_id, booking?.id]);

  // Auto-focus search when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 300);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleConfirm = () => {
    if (selected) onAssign(selected);
  };

  const filtered = cleaners.filter((c) =>
    !search.trim() ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          transition: 'opacity 0.3s ease',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        aria-hidden="true"
      />

      {/* Side Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Assign Cleaner"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '30%',
          minWidth: '320px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Assign Cleaner</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 4 }}>
              Select a cleaner for this booking. Cleaners on leave are excluded.{' '}
              <span style={{ color: 'var(--destructive)' }}>Red badges = scheduling conflict.</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              color: 'var(--muted-foreground)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--muted)',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid var(--border)',
            }}
          >
            <Search size={15} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: '0.85rem',
                color: 'var(--foreground)',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--muted-foreground)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Cleaner List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '48px 0',
                color: 'var(--muted-foreground)',
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontSize: '0.85rem' }}>Loading cleaners…</span>
            </div>
          ) : filtered.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--muted-foreground)',
                padding: '48px 0',
              }}
            >
              {search ? 'No cleaners match your search.' : 'No cleaners available for this date.'}
            </p>
          ) : (
            filtered.map((cleaner) => {
              const isSelected = selected === cleaner.id;
              return (
                <button
                  key={cleaner.id}
                  id={`cleaner-${cleaner.id}`}
                  onClick={() => setSelected(cleaner.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1.5px solid ${
                      isSelected
                        ? 'var(--primary)'
                        : cleaner.is_busy
                        ? 'rgba(239,68,68,0.3)'
                        : 'var(--border)'
                    }`,
                    background: isSelected
                      ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
                      : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = cleaner.is_busy
                        ? 'rgba(239,68,68,0.04)'
                        : 'var(--muted)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Avatar style={{ height: 36, width: 36, flexShrink: 0 }}>
                    <AvatarFallback style={{ fontSize: '0.75rem' }}>
                      {cleaner.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>{cleaner.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                      {cleaner.phone}
                    </p>
                    {/* Conflict reason — warning only, does not block assignment */}
                    {cleaner.is_busy && cleaner.busy_reason && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--destructive)', margin: '3px 0 0' }}>
                        {cleaner.busy_reason}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {cleaner.is_busy && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0">Busy</Badge>
                    )}
                    {cleaner.rating && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {Number(cleaner.rating).toFixed(1)}
                      </Badge>
                    )}
                    {isSelected && <UserCheck size={16} style={{ color: 'var(--primary)' }} />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            flexShrink: 0,
            background: '#ffffff',
          }}
        >
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selected || isAssigning}
            className="gap-2"
          >
            {isAssigning ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
            Assign Cleaner
          </Button>
        </div>
      </aside>
    </>
  );
}
