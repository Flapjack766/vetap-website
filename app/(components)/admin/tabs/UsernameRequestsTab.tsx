'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { Loader2, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { ApproveModal } from './ApproveModal';

interface UsernameRequest {
  id: string;
  user_id: string;
  requested_username: string;
  period_type: 'week' | 'month' | 'year';
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

interface UsernameRequestsTabProps {
  locale: string;
}

export function UsernameRequestsTab({ locale }: UsernameRequestsTabProps) {
  const t = useTranslations();
  const supabase = createClient();
  const [requests, setRequests] = useState<UsernameRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UsernameRequest | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all username requests with user info (including profile_id)
      const { data: requestsData, error: requestsError } = await supabase
        .from('username_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        throw requestsError;
      }

      // Fetch user info for each request
      // Note: auth.admin.getUserById requires service role key
      // For now, we'll fetch from profiles table which has email
      const requestsWithUsers = await Promise.all(
        (requestsData || []).map(async (request) => {
          // Get primary profile or first profile for the user
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('user_id', request.user_id)
            .eq('is_deleted', false)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          // If no profile found, try to get any profile (in case RLS is blocking)
          let finalProfileData = profileData;
          if (!profileData) {
            const { data: anyProfile } = await supabase
              .from('profiles')
              .select('display_name, email')
              .eq('user_id', request.user_id)
              .limit(1)
              .maybeSingle();
            finalProfileData = anyProfile;
          }

          return {
            ...request,
            user: {
              email: finalProfileData?.email || 'Unknown',
              profile: finalProfileData || undefined,
            },
          };
        })
      );

      setRequests(requestsWithUsers);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message || t('ADMIN4'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReject = async (requestId: string) => {
    if (!confirm(t('ADMIN5'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('username_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      await fetchRequests();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert(err.message || t('ADMIN6'));
    }
  };

  const handleApproveClick = (request: UsernameRequest) => {
    setSelectedRequest(request);
    setApproveModalOpen(true);
  };

  const handleApproveSuccess = () => {
    setApproveModalOpen(false);
    setSelectedRequest(null);
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded text-xs font-medium">
            {t('ADMIN7')}
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded text-xs font-medium">
            {t('ADMIN8')}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded text-xs font-medium">
            {t('ADMIN9')}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
            {t('ADMIN10')}
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
            {t('ADMIN11')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const otherRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('ADMIN3')}</CardTitle>
          <CardDescription>{t('ADMIN12')}</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 && otherRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('ADMIN13')}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('ADMIN14')} ({pendingRequests.length})</h3>
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
                                  {request.user?.profile?.display_name || t('ADMIN15')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {request.user?.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">{t('ADMIN16')}: </span>
                                <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                                  {request.requested_username}
                                </code>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t('ADMIN17')}: </span>
                                <span>{t(`USERNAME${request.period_type === 'week' ? '11' : request.period_type === 'month' ? '12' : '13'}`)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t('ADMIN18')}: </span>
                                <span>{formatDate(request.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(request.status)}
                            <Button
                              size="sm"
                              onClick={() => handleApproveClick(request)}
                              className="gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {t('ADMIN19')}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request.id)}
                              className="gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              {t('ADMIN20')}
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
                  <h3 className="text-lg font-semibold mb-4">{t('ADMIN21')} ({otherRequests.length})</h3>
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
                                {request.user?.profile?.display_name || t('ADMIN15')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {request.user?.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">{t('ADMIN16')}: </span>
                                <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                                  {request.requested_username}
                                </code>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t('ADMIN17')}: </span>
                                <span>{t(`USERNAME${request.period_type === 'week' ? '11' : request.period_type === 'month' ? '12' : '13'}`)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t('ADMIN18')}: </span>
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

      {selectedRequest && (
        <ApproveModal
          open={approveModalOpen}
          onOpenChange={setApproveModalOpen}
          request={selectedRequest}
          locale={locale}
          onSuccess={handleApproveSuccess}
        />
      )}
    </>
  );
}

