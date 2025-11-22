'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { Textarea } from '@/app/(components)/ui/textarea';
import { Label } from '@/app/(components)/ui/label';
import { Loader2, CheckCircle2, XCircle, Code, Palette, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TemplateRequest {
  id: string;
  profile_id: string;
  request_title: string;
  description: string;
  data_source?: 'use_existing' | 'build_from_scratch';
  required_fields?: string[];
  uploaded_images?: Record<string, string>;
  custom_data?: Record<string, string>;
  color_scheme: string | null;
  layout_preference: string | null;
  special_features: string | null;
  reference_urls: string | null;
  additional_notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  template_code: string | null;
  admin_notes: string | null;
  created_at: string;
  user?: {
    email: string;
    profile?: {
      display_name: string;
    };
  };
}

interface TemplateRequestsTabProps {
  locale: string;
}

export function TemplateRequestsTab({ locale }: TemplateRequestsTabProps) {
  const t = useTranslations();
  const supabase = createClient();
  const [requests, setRequests] = useState<TemplateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TemplateRequest | null>(null);
  const [templateCode, setTemplateCode] = useState('');
  const [approving, setApproving] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: requestsData, error: requestsError } = await supabase
        .from('custom_template_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        throw requestsError;
      }

      const requestsWithUsers = await Promise.all(
        (requestsData || []).map(async (request) => {
          // Get profile by profile_id (if provided) or fallback to user_id
          let profileData = null;
          if (request.profile_id) {
            const { data } = await supabase
              .from('profiles')
              .select('display_name, email')
              .eq('id', request.profile_id)
              .eq('is_deleted', false)
              .maybeSingle();
            profileData = data;
          }
          
          // If no profile found by profile_id, try to get by user_id
          if (!profileData && request.user_id) {
            const { data } = await supabase
              .from('profiles')
              .select('display_name, email')
              .eq('user_id', request.user_id)
              .eq('is_deleted', false)
              .order('is_primary', { ascending: false })
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle();
            profileData = data;
          }

          return {
            ...request,
            user: {
              email: profileData?.email || 'Unknown',
              profile: profileData || undefined,
            },
          };
        })
      );

      setRequests(requestsWithUsers);
    } catch (err: any) {
      console.error('Error fetching template requests:', err);
      setError(err.message || t('ADMIN4'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReject = async (requestId: string) => {
    if (!confirm(t('TEMPLATE37'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_template_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      await fetchRequests();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert(err.message || t('TEMPLATE38'));
    }
  };

  const handleApproveClick = (request: TemplateRequest) => {
    setSelectedRequest(request);
    setTemplateCode(request.template_code || '');
    setApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !templateCode.trim()) {
      alert(t('TEMPLATE39'));
      return;
    }

    try {
      setApproving(true);

      // Call API route to approve template
      const response = await fetch('/api/admin/approve-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          template_code: templateCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || t('TEMPLATE41'));
      }

      setApproveModalOpen(false);
      setSelectedRequest(null);
      setTemplateCode('');
      await fetchRequests();
      alert(t('TEMPLATE40'));
    } catch (err: any) {
      console.error('Error approving template request:', err);
      const errorMessage = err.message || err.error || err.details || JSON.stringify(err) || t('TEMPLATE41');
      alert(errorMessage);
    } finally {
      setApproving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded text-xs font-medium">
            {t('TEMPLATE36')}
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded text-xs font-medium">
            {t('TEMPLATE42')}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded text-xs font-medium">
            {t('TEMPLATE43')}
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
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('TEMPLATE44')}
          </CardTitle>
          <CardDescription>{t('TEMPLATE45')}</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 && otherRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('TEMPLATE46')}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('TEMPLATE47')} ({pendingRequests.length})</h3>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="font-medium text-lg mb-1">{request.request_title}</p>
                              <p className="text-sm text-muted-foreground">
                                {request.user?.profile?.display_name || t('ADMIN15')} • {request.user?.email}
                              </p>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">{t('TEMPLATE13')}:</span>
                                <p className="text-muted-foreground mt-1">{request.description}</p>
                              </div>
                              
                              {request.color_scheme && (
                                <div>
                                  <span className="font-medium">{t('TEMPLATE15')}:</span>
                                  <span className="text-muted-foreground ml-2">{request.color_scheme}</span>
                                </div>
                              )}
                              
                              {request.layout_preference && (
                                <div>
                                  <span className="font-medium">{t('TEMPLATE17')}:</span>
                                  <span className="text-muted-foreground ml-2">{request.layout_preference}</span>
                                </div>
                              )}
                              
                              {request.special_features && (
                                <div>
                                  <span className="font-medium">{t('TEMPLATE24')}:</span>
                                  <p className="text-muted-foreground mt-1">{request.special_features}</p>
                                </div>
                              )}
                              
                              {request.reference_urls && (
                                <div>
                                  <span className="font-medium">{t('TEMPLATE26')}:</span>
                                  <a href={request.reference_urls} target="_blank" rel="noopener noreferrer" className="text-primary ml-2 hover:underline">
                                    {request.reference_urls}
                                  </a>
                                </div>
                              )}
                              
                              {request.additional_notes && (
                                <div>
                                  <span className="font-medium">{t('TEMPLATE28')}:</span>
                                  <p className="text-muted-foreground mt-1">{request.additional_notes}</p>
                                </div>
                              )}
                              
                              {request.data_source && (
                                <div>
                                  <span className="font-medium">{t('TEMPLATE60')}:</span>
                                  <span className="text-muted-foreground ml-2">
                                    {request.data_source === 'use_existing' ? t('TEMPLATE61') : t('TEMPLATE62')}
                                  </span>
                                </div>
                              )}
                              
                              {request.required_fields && Array.isArray(request.required_fields) && request.required_fields.length > 0 && (
                                <div>
                                  <span className="font-medium">{t('TEMPLATE63')}:</span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {request.required_fields.map((field: string) => (
                                      <span key={field} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                        {field}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {request.uploaded_images && Object.keys(request.uploaded_images).length > 0 && (
                                <div>
                                  <span className="font-medium flex items-center gap-2">{t('TEMPLATE72')}:</span>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    {Object.entries(request.uploaded_images).map(([key, url]: [string, any]) => (
                                      <div key={key} className="relative group">
                                        <img src={url} alt={key} className="w-full h-24 object-cover rounded-lg border" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                          <ImageIcon className="h-6 w-6 text-white" />
                                        </a>
                                        <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-2 py-1 rounded">{key}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              {t('TEMPLATE35')}: {formatDate(request.created_at)}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(request.status)}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveClick(request)}
                                className="gap-2"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                {t('TEMPLATE48')}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request.id)}
                                className="gap-2"
                              >
                                <XCircle className="h-4 w-4" />
                                {t('TEMPLATE49')}
                              </Button>
                            </div>
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
                  <h3 className="text-lg font-semibold mb-4">{t('TEMPLATE50')} ({otherRequests.length})</h3>
                  <div className="space-y-4">
                    {otherRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border rounded-lg space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="font-medium">{request.request_title}</p>
                              <p className="text-sm text-muted-foreground">
                                {request.user?.profile?.display_name || t('ADMIN15')} • {request.user?.email}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('TEMPLATE35')}: {formatDate(request.created_at)}
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

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {t('TEMPLATE51')}
            </DialogTitle>
            <DialogDescription>{t('TEMPLATE52')}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{selectedRequest.request_title}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="template_code">{t('TEMPLATE53')} *</Label>
              <Textarea
                id="template_code"
                value={templateCode}
                onChange={(e) => setTemplateCode(e.target.value)}
                placeholder={t('TEMPLATE54')}
                rows={20}
                className="font-mono text-sm"
                disabled={approving}
              />
              <p className="text-xs text-muted-foreground">{t('TEMPLATE55')}</p>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setApproveModalOpen(false);
                  setTemplateCode('');
                }}
                disabled={approving}
              >
                {t('TEMPLATE56')}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approving || !templateCode.trim()}
                className="gap-2"
              >
                {approving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('TEMPLATE57')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t('TEMPLATE58')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

