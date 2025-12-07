'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Book,
  Code,
  Key,
  Webhook,
  Users,
  Ticket,
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';

interface APIDocumentationProps {
  locale: string;
}

interface EndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  title: string;
  description: string;
  auth: 'Bearer Token' | 'API Key' | 'None';
  requestBody?: {
    contentType: string;
    fields: { name: string; type: string; required: boolean; description: string }[];
    example: Record<string, any>;
  };
  response: {
    fields: { name: string; type: string; description: string }[];
    example: Record<string, any>;
  };
}

export function APIDocumentation({ locale }: APIDocumentationProps) {
  const t = useTranslations();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['events']));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'POST': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PUT': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'PATCH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'DELETE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // API Endpoints Documentation
  const endpoints: Record<string, EndpointDoc[]> = {
    events: [
      {
        method: 'GET',
        path: '/api/event/events',
        title: 'List Events',
        description: 'Get a list of all events for your organization',
        auth: 'Bearer Token',
        response: {
          fields: [
            { name: 'events', type: 'Event[]', description: 'Array of event objects' },
          ],
          example: {
            events: [
              {
                id: 'uuid',
                name: 'Annual Conference 2024',
                description: 'Company annual conference',
                venue: 'Grand Hall',
                starts_at: '2024-03-15T09:00:00Z',
                ends_at: '2024-03-15T18:00:00Z',
                status: 'active',
                template_id: 'uuid',
              },
            ],
          },
        },
      },
      {
        method: 'POST',
        path: '/api/event/events',
        title: 'Create Event',
        description: 'Create a new event',
        auth: 'Bearer Token',
        requestBody: {
          contentType: 'application/json',
          fields: [
            { name: 'name', type: 'string', required: true, description: 'Event name' },
            { name: 'description', type: 'string', required: false, description: 'Event description' },
            { name: 'venue', type: 'string', required: false, description: 'Event venue/location' },
            { name: 'starts_at', type: 'string (ISO 8601)', required: true, description: 'Event start time' },
            { name: 'ends_at', type: 'string (ISO 8601)', required: true, description: 'Event end time' },
            { name: 'template_id', type: 'string (UUID)', required: false, description: 'Invitation template ID' },
          ],
          example: {
            name: 'Annual Conference 2024',
            description: 'Company annual conference',
            venue: 'Grand Hall',
            starts_at: '2024-03-15T09:00:00Z',
            ends_at: '2024-03-15T18:00:00Z',
          },
        },
        response: {
          fields: [
            { name: 'event', type: 'Event', description: 'Created event object' },
          ],
          example: {
            event: {
              id: 'uuid',
              name: 'Annual Conference 2024',
              status: 'draft',
            },
          },
        },
      },
    ],
    guests: [
      {
        method: 'GET',
        path: '/api/event/events/{event_id}/guests',
        title: 'List Guests',
        description: 'Get all guests for an event',
        auth: 'Bearer Token',
        response: {
          fields: [
            { name: 'guests', type: 'Guest[]', description: 'Array of guest objects' },
          ],
          example: {
            guests: [
              {
                id: 'uuid',
                full_name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                type: 'VIP',
              },
            ],
          },
        },
      },
      {
        method: 'POST',
        path: '/api/event/events/{event_id}/guests',
        title: 'Add Guest',
        description: 'Add a new guest to an event',
        auth: 'Bearer Token',
        requestBody: {
          contentType: 'application/json',
          fields: [
            { name: 'full_name', type: 'string', required: true, description: 'Guest full name' },
            { name: 'email', type: 'string', required: false, description: 'Guest email address' },
            { name: 'phone', type: 'string', required: false, description: 'Guest phone number' },
            { name: 'type', type: 'string', required: false, description: 'Guest type: VIP, Regular, Staff, Media, Other' },
            { name: 'notes', type: 'string', required: false, description: 'Additional notes' },
          ],
          example: {
            full_name: 'John Doe',
            email: 'john@example.com',
            type: 'VIP',
          },
        },
        response: {
          fields: [
            { name: 'guest', type: 'Guest', description: 'Created guest object' },
          ],
          example: {
            guest: {
              id: 'uuid',
              full_name: 'John Doe',
              email: 'john@example.com',
              type: 'VIP',
            },
          },
        },
      },
      {
        method: 'POST',
        path: '/api/event/events/{event_id}/guests/import',
        title: 'Import Guests',
        description: 'Bulk import guests from an array',
        auth: 'Bearer Token',
        requestBody: {
          contentType: 'application/json',
          fields: [
            { name: 'guests', type: 'Guest[]', required: true, description: 'Array of guest objects to import' },
          ],
          example: {
            guests: [
              { full_name: 'John Doe', email: 'john@example.com', type: 'VIP' },
              { full_name: 'Jane Smith', email: 'jane@example.com', type: 'Regular' },
            ],
          },
        },
        response: {
          fields: [
            { name: 'imported', type: 'number', description: 'Number of guests imported' },
            { name: 'skipped', type: 'number', description: 'Number of guests skipped (duplicates)' },
          ],
          example: {
            imported: 2,
            skipped: 0,
          },
        },
      },
    ],
    passes: [
      {
        method: 'POST',
        path: '/api/event/events/{event_id}/passes',
        title: 'Generate Passes',
        description: 'Generate passes for guests without passes',
        auth: 'Bearer Token',
        requestBody: {
          contentType: 'application/json',
          fields: [
            { name: 'guest_ids', type: 'string[]', required: false, description: 'Specific guest IDs (if empty, generates for all)' },
          ],
          example: {
            guest_ids: ['uuid1', 'uuid2'],
          },
        },
        response: {
          fields: [
            { name: 'passes', type: 'Pass[]', description: 'Array of generated passes' },
            { name: 'generated', type: 'number', description: 'Number of passes generated' },
          ],
          example: {
            passes: [
              {
                id: 'uuid',
                guest_id: 'uuid',
                token: 'pass-token',
                qr_payload: 'VETAP:pass-id:token:signature',
                status: 'unused',
              },
            ],
            generated: 2,
          },
        },
      },
      {
        method: 'GET',
        path: '/api/event/events/{event_id}/passes',
        title: 'List Passes',
        description: 'Get all passes for an event',
        auth: 'Bearer Token',
        response: {
          fields: [
            { name: 'passes', type: 'Pass[]', description: 'Array of pass objects' },
          ],
          example: {
            passes: [
              {
                id: 'uuid',
                guest_id: 'uuid',
                token: 'pass-token',
                status: 'unused',
                invite_file_url: 'https://...',
              },
            ],
          },
        },
      },
    ],
    checkin: [
      {
        method: 'POST',
        path: '/api/event/check-in',
        title: 'Check-in Guest',
        description: 'Process a check-in by verifying a QR code',
        auth: 'Bearer Token',
        requestBody: {
          contentType: 'application/json',
          fields: [
            { name: 'qr_raw_value', type: 'string', required: true, description: 'Raw QR code value scanned' },
            { name: 'event_id', type: 'string', required: true, description: 'Event ID' },
            { name: 'gate_id', type: 'string', required: false, description: 'Gate ID (if applicable)' },
          ],
          example: {
            qr_raw_value: 'VETAP:pass-id:token:signature',
            event_id: 'uuid',
            gate_id: 'uuid',
          },
        },
        response: {
          fields: [
            { name: 'result', type: 'string', description: 'valid, already_used, invalid, expired, revoked, not_allowed_zone' },
            { name: 'guest', type: 'Guest', description: 'Guest information (if found)' },
            { name: 'pass', type: 'Pass', description: 'Pass information' },
            { name: 'message', type: 'string', description: 'Human-readable message' },
          ],
          example: {
            result: 'valid',
            guest: {
              id: 'uuid',
              full_name: 'John Doe',
              type: 'VIP',
            },
            pass: {
              id: 'uuid',
              status: 'used',
              first_used_at: '2024-03-15T09:30:00Z',
            },
            message: 'Check-in successful',
          },
        },
      },
    ],
  };

  const webhookEvents = [
    {
      name: 'on_pass_generated',
      description: 'Triggered when a new pass is generated for a guest',
      payload: {
        event: 'on_pass_generated',
        timestamp: '2024-03-15T09:00:00Z',
        data: {
          event_id: 'uuid',
          event_name: 'Annual Conference 2024',
          pass_id: 'uuid',
          guest: {
            id: 'uuid',
            full_name: 'John Doe',
            type: 'VIP',
          },
          qr_payload: 'VETAP:pass-id:token:signature',
          invite_file_url: 'https://...',
        },
      },
    },
    {
      name: 'on_check_in_valid',
      description: 'Triggered when a guest successfully checks in',
      payload: {
        event: 'on_check_in_valid',
        timestamp: '2024-03-15T09:30:00Z',
        data: {
          event_id: 'uuid',
          pass_id: 'uuid',
          guest: {
            id: 'uuid',
            full_name: 'John Doe',
            type: 'VIP',
          },
          gate_id: 'uuid',
          scanned_at: '2024-03-15T09:30:00Z',
        },
      },
    },
    {
      name: 'on_check_in_invalid',
      description: 'Triggered when a check-in attempt fails',
      payload: {
        event: 'on_check_in_invalid',
        timestamp: '2024-03-15T09:30:00Z',
        data: {
          event_id: 'uuid',
          pass_id: 'uuid',
          result: 'already_used',
          guest: {
            id: 'uuid',
            full_name: 'John Doe',
            type: 'VIP',
          },
          first_used_at: '2024-03-15T09:15:00Z',
        },
      },
    },
    {
      name: 'on_event_created',
      description: 'Triggered when a new event is created',
      payload: {
        event: 'on_event_created',
        timestamp: '2024-03-01T10:00:00Z',
        data: {
          event_id: 'uuid',
          event_name: 'Annual Conference 2024',
          starts_at: '2024-03-15T09:00:00Z',
          ends_at: '2024-03-15T18:00:00Z',
        },
      },
    },
    {
      name: 'on_event_updated',
      description: 'Triggered when an event is updated',
      payload: {
        event: 'on_event_updated',
        timestamp: '2024-03-02T14:00:00Z',
        data: {
          event_id: 'uuid',
          event_name: 'Annual Conference 2024',
          changes: ['venue', 'description'],
        },
      },
    },
  ];

  const sections = [
    { id: 'events', title: t('API_DOC_EVENTS'), icon: Calendar, endpoints: endpoints.events },
    { id: 'guests', title: t('API_DOC_GUESTS'), icon: Users, endpoints: endpoints.guests },
    { id: 'passes', title: t('API_DOC_PASSES'), icon: Ticket, endpoints: endpoints.passes },
    { id: 'checkin', title: t('API_DOC_CHECKIN'), icon: Code, endpoints: endpoints.checkin },
  ];

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative bg-slate-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <span className="text-xs text-slate-400">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-slate-400 hover:text-white"
          onClick={() => copyCode(code, id)}
        >
          {copiedCode === id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className="p-4 text-sm text-slate-300 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Book className="h-8 w-8" />
          {t('API_DOC_TITLE')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('API_DOC_DESC')}</p>
      </div>

      {/* Authentication */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" />
          {t('API_DOC_AUTH')}
        </h2>
        <p className="text-muted-foreground mb-4">{t('API_DOC_AUTH_DESC')}</p>
        
        <CodeBlock
          id="auth-header"
          language="HTTP Header"
          code={`Authorization: Bearer YOUR_ACCESS_TOKEN

# Or using API Key:
X-API-Key: vetap_YOUR_API_KEY`}
        />
      </div>

      {/* Base URL */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{t('API_DOC_BASE_URL')}</h2>
        <CodeBlock
          id="base-url"
          language="URL"
          code={`https://your-domain.com/api/event`}
        />
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('API_DOC_ENDPOINTS')}</h2>
        
        {sections.map((section) => (
          <div key={section.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <section.icon className="h-5 w-5 text-primary" />
                <span className="font-semibold">{section.title}</span>
                <span className="text-sm text-muted-foreground">
                  ({section.endpoints.length} endpoints)
                </span>
              </div>
              {expandedSections.has(section.id) ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>

            {expandedSections.has(section.id) && (
              <div className="border-t border-border divide-y divide-border">
                {section.endpoints.map((endpoint, idx) => (
                  <div key={idx} className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded border ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">{endpoint.title}</h4>
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground">{t('API_DOC_AUTH_TYPE')}: </span>
                      <span className="font-medium">{endpoint.auth}</span>
                    </div>

                    {endpoint.requestBody && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">{t('API_DOC_REQUEST_BODY')}</h5>
                        <div className="bg-muted/30 rounded-lg p-4">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-muted-foreground">
                                <th className="pb-2">{t('API_DOC_FIELD')}</th>
                                <th className="pb-2">{t('API_DOC_TYPE')}</th>
                                <th className="pb-2">{t('API_DOC_REQUIRED')}</th>
                                <th className="pb-2">{t('API_DOC_DESCRIPTION')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {endpoint.requestBody.fields.map((field, fidx) => (
                                <tr key={fidx}>
                                  <td className="py-2 font-mono text-primary">{field.name}</td>
                                  <td className="py-2 text-muted-foreground">{field.type}</td>
                                  <td className="py-2">
                                    {field.required ? (
                                      <span className="text-red-500">{t('API_DOC_YES')}</span>
                                    ) : (
                                      <span className="text-muted-foreground">{t('API_DOC_NO')}</span>
                                    )}
                                  </td>
                                  <td className="py-2 text-muted-foreground">{field.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <CodeBlock
                          id={`${section.id}-${idx}-req`}
                          language="JSON"
                          code={JSON.stringify(endpoint.requestBody.example, null, 2)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">{t('API_DOC_RESPONSE')}</h5>
                      <CodeBlock
                        id={`${section.id}-${idx}-res`}
                        language="JSON"
                        code={JSON.stringify(endpoint.response.example, null, 2)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Webhooks */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            {t('API_DOC_WEBHOOKS')}
          </h2>
          <p className="text-muted-foreground mt-2">{t('API_DOC_WEBHOOKS_DESC')}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Webhook Security */}
          <div>
            <h3 className="font-semibold mb-2">{t('API_DOC_WEBHOOK_SECURITY')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('API_DOC_WEBHOOK_SECURITY_DESC')}</p>
            <CodeBlock
              id="webhook-verify"
              language="JavaScript"
              code={`// Verify webhook signature
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === \`sha256=\${expectedSignature}\`;
}

// In your webhook handler:
app.post('/webhooks/vetap', (req, res) => {
  const signature = req.headers['x-vetap-signature'];
  const isValid = verifyWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook...
  const { event, data } = req.body;
  console.log(\`Received \${event}\`, data);
  
  res.status(200).send('OK');
});`}
            />
          </div>

          {/* Webhook Events */}
          <div>
            <h3 className="font-semibold mb-4">{t('API_DOC_WEBHOOK_EVENTS')}</h3>
            <div className="space-y-4">
              {webhookEvents.map((webhookEvent, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-mono text-primary">{webhookEvent.name}</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{webhookEvent.description}</p>
                  <CodeBlock
                    id={`webhook-${idx}`}
                    language="JSON"
                    code={JSON.stringify(webhookEvent.payload, null, 2)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Webhook Headers */}
          <div>
            <h3 className="font-semibold mb-2">{t('API_DOC_WEBHOOK_HEADERS')}</h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2">{t('API_DOC_HEADER')}</th>
                    <th className="pb-2">{t('API_DOC_DESCRIPTION')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 font-mono">X-VETAP-Event</td>
                    <td className="py-2 text-muted-foreground">Event type (e.g., on_check_in_valid)</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">X-VETAP-Signature</td>
                    <td className="py-2 text-muted-foreground">HMAC-SHA256 signature (sha256=...)</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">X-VETAP-Timestamp</td>
                    <td className="py-2 text-muted-foreground">ISO 8601 timestamp of the event</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">X-VETAP-Delivery</td>
                    <td className="py-2 text-muted-foreground">Unique delivery ID (UUID)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limits */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{t('API_DOC_RATE_LIMITS')}</h2>
        <p className="text-muted-foreground mb-4">{t('API_DOC_RATE_LIMITS_DESC')}</p>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>1000 requests per minute per API key</li>
          <li>100 check-in requests per second per event</li>
          <li>Rate limit headers are included in all responses</li>
        </ul>
      </div>
    </div>
  );
}

