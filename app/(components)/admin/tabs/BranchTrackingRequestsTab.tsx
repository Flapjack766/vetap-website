'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { Loader2, CheckCircle2, XCircle, Calendar } from 'lucide-react';

interface BranchTrackingRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  profile_id?: string | null;
  user?: {
    email: string;
    profile?: {
      display_name: string;
    };
  };
}

interface BranchTrackingRequestsTabProps {
  locale: string;
}

export function BranchTrackingRequestsTab({ locale }: BranchTrackingRequestsTabProps) {
  const t = useTranslations();
  const [requests, setRequests] = useState<BranchTrackingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all branch tracking requests via API route (uses service role)
      const response = await fetch('/api/admin/branch-tracking-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch branch tracking requests');
      }

      console.log('Received requests:', data.requests?.length || 0);
      setRequests(data.requests || []);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من قبول هذا الطلب؟' : 'Are you sure you want to approve this request?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/approve-branch-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      await fetchRequests();
    } catch (err: any) {
      console.error('Error approving request:', err);
      alert(err.message || (locale === 'ar' ? 'فشل قبول الطلب' : 'Failed to approve request'));
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من رفض هذا الطلب؟' : 'Are you sure you want to reject this request?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/reject-branch-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          rejection_reason: undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Reject request failed:', data);
        throw new Error(data.error || data.details || 'Failed to reject request');
      }

      await fetchRequests();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert(err.message || (locale === 'ar' ? 'فشل رفض الطلب' : 'Failed to reject request'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded text-xs font-medium">
            {locale === 'ar' ? 'قيد المراجعة' : 'Pending'}
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded text-xs font-medium">
            {locale === 'ar' ? 'مقبول' : 'Approved'}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded text-xs font-medium">
            {locale === 'ar' ? 'مرفوض' : 'Rejected'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
            {locale === 'ar' ? 'ملغي' : 'Cancelled'}
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-destructive">{error}</div>
          <Button onClick={fetchRequests} className="mt-4 mx-auto block">
            {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const otherRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locale === 'ar' ? 'طلبات داشبورد تتبع الفروع' : 'Branch Tracking Dashboard Requests'}</CardTitle>
        <CardDescription>
          {locale === 'ar' 
            ? 'إدارة طلبات الحصول على داشبورد تتبع الفروع والكروت'
            : 'Manage requests for Branch Tracking Dashboard access'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 && otherRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {locale === 'ar' ? 'لا توجد طلبات' : 'No requests found'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {locale === 'ar' ? 'الطلبات قيد المراجعة' : 'Pending Requests'} ({pendingRequests.length})
                </h3>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">
                                {request.user?.profile?.display_name || (locale === 'ar' ? 'مستخدم' : 'User')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.user?.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">{locale === 'ar' ? 'تاريخ الطلب:' : 'Request Date:'} </span>
                              <span>{formatDate(request.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            className="gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {locale === 'ar' ? 'قبول' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request.id)}
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            {locale === 'ar' ? 'رفض' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Requests */}
            {otherRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {locale === 'ar' ? 'الطلبات الأخرى' : 'Other Requests'} ({otherRequests.length})
                </h3>
                <div className="space-y-4">
                  {otherRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-medium">
                              {request.user?.profile?.display_name || (locale === 'ar' ? 'مستخدم' : 'User')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.user?.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">{locale === 'ar' ? 'تاريخ الطلب:' : 'Request Date:'} </span>
                              <span>{formatDate(request.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

