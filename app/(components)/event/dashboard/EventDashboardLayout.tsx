'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Calendar, Users, LogOut, Menu, X, Ticket, BarChart3, QrCode, Settings, Activity, PieChart } from 'lucide-react';
import { createEventClient, clearEventClient } from '@/lib/supabase/event-client';
import { Button } from '@/app/(components)/ui/button';
import { canAccessMenu } from '@/lib/event/permissions';
import type { UserRole } from '@/lib/event/types';

interface EventDashboardLayoutProps {
  children: React.ReactNode;
  locale: string;
}

interface EventUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  partner_id?: string | null;
}

export function EventDashboardLayout({ children, locale }: EventDashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [user, setUser] = useState<EventUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createEventClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          router.push(`/${locale}/event/login`);
          return;
        }

        const { data: eventUser } = await supabase
          .from('event_users')
          .select('id, name, email, role, partner_id')
          .eq('id', authUser.id)
          .maybeSingle();

        if (eventUser) {
          setUser(eventUser as EventUser);
        } else {
          // Default to organizer if no record exists
          setUser({ 
            id: authUser.id, 
            email: authUser.email || '', 
            name: authUser.email || '',
            role: 'organizer',
            partner_id: null,
          });
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push(`/${locale}/event/login`);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [locale, router]);

  const handleLogout = async () => {
    const supabase = createEventClient();
    await supabase.auth.signOut();
    clearEventClient();
    router.push(`/${locale}/event/login`);
  };

  // Check if user has permission for a menu feature
  const hasMenuPermission = (feature: string): boolean => {
    if (!user) return false;
    return canAccessMenu(user.role, feature);
  };

  // Build menu items based on permissions
  const allMenuItems = [
    { 
      href: `/${locale}/event/dashboard`, 
      label: t('EVENT_EVENTS'), 
      icon: Calendar, 
      exact: true,
      feature: 'events',
    },
    { 
      href: `/${locale}/event/dashboard/guests`, 
      label: t('EVENT_GUESTS'), 
      icon: Users, 
      exact: false,
      feature: 'guests',
    },
    { 
      href: `/${locale}/event/dashboard/invites`, 
      label: t('EVENT_INVITES'), 
      icon: Ticket, 
      exact: false,
      feature: 'invites',
    },
    { 
      href: `/${locale}/event/dashboard/statistics`, 
      label: t('EVENT_STATISTICS'), 
      icon: BarChart3, 
      exact: false,
      feature: 'statistics',
    },
    { 
      href: `/${locale}/event/dashboard/check-in`, 
      label: t('EVENT_CHECK_IN'), 
      icon: QrCode, 
      exact: false,
      feature: 'check-in',
    },
    { 
      href: `/${locale}/event/dashboard/analytics`, 
      label: t('EVENT_ANALYTICS'), 
      icon: PieChart, 
      exact: false,
      feature: 'analytics',
    },
    { 
      href: `/${locale}/event/dashboard/monitoring`, 
      label: t('EVENT_MONITORING'), 
      icon: Activity, 
      exact: false,
      feature: 'monitoring',
    },
    { 
      href: `/${locale}/event/dashboard/settings`, 
      label: t('EVENT_SETTINGS'), 
      icon: Settings, 
      exact: false,
      feature: 'settings',
    },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => hasMenuPermission(item.feature));

  // Get role display name
  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'owner': return t('EVENT_ROLE_OWNER');
      case 'partner_admin': return t('EVENT_ROLE_PARTNER_ADMIN');
      case 'organizer': return t('EVENT_ROLE_ORGANIZER');
      case 'gate_staff': return t('EVENT_ROLE_GATE_STAFF');
      default: return role;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case 'owner': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'partner_admin': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'organizer': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'gate_staff': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden sticky top-0 z-50 border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">{t('EVENT_DASHBOARD')}</h1>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform`}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">{t('EVENT_APP_NAME')}</h2>
              {user && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">{user.name || user.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded border ${getRoleBadgeColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
              )}
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t">
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-2" />
                {t('EVENT_AUTH_LOGOUT')}
              </Button>
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

// Export type for use in other components
export { type EventUser };
