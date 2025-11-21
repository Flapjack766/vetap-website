'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/app/(components)/ui/button';
import { Label } from '@/app/(components)/ui/label';
import { Input } from '@/app/(components)/ui/input';
import { Loader2, Calendar } from 'lucide-react';

interface UsernameRequest {
  id: string;
  user_id: string;
  requested_username: string;
  period_type: 'week' | 'month' | 'year';
  status: string;
}

interface ApproveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: UsernameRequest;
  locale: string;
  onSuccess: () => void;
}

export function ApproveModal({
  open,
  onOpenChange,
  request,
  locale,
  onSuccess,
}: ApproveModalProps) {
  const t = useTranslations();
  const [startDate, setStartDate] = useState(() => {
    // Default to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  });
  const [periodType, setPeriodType] = useState<'week' | 'month' | 'year'>(request.period_type);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/approve-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: request.id,
          user_id: request.user_id,
          username: request.requested_username,
          start_date: startDate,
          period_type: periodType,
          profile_id: (request as any).profile_id || null, // Include profile_id if available
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details || data.error || t('ADMIN22');
        throw new Error(errorMessage);
      }

      // Refresh the page to show updated data
      window.location.reload();
      onSuccess();
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError(err.message || t('ADMIN22'));
    } finally {
      setLoading(false);
    }
  };

  const calculateEndDate = () => {
    const start = new Date(startDate);
    const end = new Date(start);

    switch (periodType) {
      case 'week':
        end.setDate(end.getDate() + 7);
        break;
      case 'month':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'year':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }

    return end.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('ADMIN23')}</DialogTitle>
          <DialogDescription>{t('ADMIN24')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">{t('ADMIN16')}</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <code className="text-sm font-mono">{request.requested_username}</code>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">{t('ADMIN25')}</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {t('ADMIN26')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">{t('ADMIN17')}</Label>
            <select
              id="period"
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as 'week' | 'month' | 'year')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              <option value="week">{t('USERNAME11')}</option>
              <option value="month">{t('USERNAME12')}</option>
              <option value="year">{t('USERNAME13')}</option>
            </select>
          </div>

          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('ADMIN27')}: </span>
              <span className="font-medium">{calculateEndDate()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('USERNAME16')}
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('ADMIN28')}
              </>
            ) : (
              t('ADMIN29')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

