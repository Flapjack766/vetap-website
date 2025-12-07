'use client';

import { useState } from 'react';
import { createEventClient } from '@/lib/supabase/event-client';
import { Button } from '@/app/(components)/ui/button';

export default function TestConnectionPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EVENT_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_EVENT_ANON_KEY;

      console.log('Environment check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
        keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING',
      });

      if (!supabaseUrl || !supabaseAnonKey) {
        setResult({
          success: false,
          error: 'Missing environment variables',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseAnonKey,
          },
        });
        setLoading(false);
        return;
      }

      // Create client
      const supabase = createEventClient();
      console.log('Supabase client created');

      // Test 1: Check auth service
      console.log('Testing auth service...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      console.log('Auth session:', { data: authData, error: authError });

      // Test 2: Try to query a table (this will fail if RLS blocks, but connection works)
      console.log('Testing database connection...');
      const { data: dbData, error: dbError } = await supabase
        .from('event_users')
        .select('id, email, name')
        .limit(1);

      console.log('Database query:', { 
        data: dbData, 
        error: dbError ? {
          message: dbError.message,
          code: dbError.code,
          details: dbError.details,
          hint: dbError.hint,
        } : null,
      });

      // Test 2.5: Check if table exists
      if (dbError) {
        if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
          console.error('❌ CRITICAL: event_users table does not exist!');
          console.error('   Please run migrations in Supabase SQL Editor');
        } else if (dbError.code === '42501' || dbError.message?.includes('permission denied')) {
          console.error('❌ RLS Error: Permission denied');
          console.error('   This might be because RLS policies are too restrictive');
        }
      }

      // Test 3: Try signup (this will create a test user)
      const testEmail = `test-${Date.now()}@test.com`;
      console.log('Testing signup with:', testEmail);
      
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'Test123456!',
        options: {
          data: {
            name: 'Test User',
            phone: '1234567890',
            phone_country_code: '+966',
            country: 'Saudi Arabia',
            city: 'Riyadh',
          },
        },
      });

      console.log('Signup result:', {
        hasUser: !!signupData?.user,
        userId: signupData?.user?.id,
        email: signupData?.user?.email,
        error: signupError,
      });

      setResult({
        success: !signupError && !dbError,
        environment: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          url: supabaseUrl,
        },
        auth: {
          session: authData,
          error: authError,
        },
        database: {
          query: dbData,
          error: dbError ? {
            message: dbError.message,
            code: dbError.code,
            details: dbError.details,
            hint: dbError.hint,
          } : null,
        },
        signup: {
          user: signupData?.user ? {
            id: signupData.user.id,
            email: signupData.user.email,
            created_at: signupData.user.created_at,
          } : null,
          error: signupError ? {
            message: signupError.message,
            status: signupError.status,
            name: signupError.name,
          } : null,
        },
      });
    } catch (error: any) {
      console.error('Test error:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error',
        stack: error.stack,
      });
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">VETAP Event - Test Connection</h1>
      
      <Button onClick={testConnection} disabled={loading} className="mb-6">
        {loading ? 'Testing...' : 'Test Supabase Event Connection'}
      </Button>

      {result && (
        <div className="mt-6 space-y-4">
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
            <h2 className="font-bold mb-2">
              {result.success ? '✅ Connection Successful' : '❌ Connection Failed'}
            </h2>
            <pre className="text-xs overflow-auto bg-black/5 dark:bg-white/5 p-4 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          {result.environment && (
            <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <h3 className="font-bold mb-2">Environment Variables:</h3>
              <ul className="text-sm space-y-1">
                <li>URL: {result.environment.hasUrl ? '✅ Present' : '❌ Missing'}</li>
                <li>Key: {result.environment.hasKey ? '✅ Present' : '❌ Missing'}</li>
                {result.environment.url && (
                  <li>URL Preview: {result.environment.url.substring(0, 50)}...</li>
                )}
              </ul>
            </div>
          )}

          {result.signup?.error && (
            <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <h3 className="font-bold mb-2">⚠️ Signup Error:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result.signup.error, null, 2)}
              </pre>
            </div>
          )}

          {result.signup?.user && (
            <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20">
              <h3 className="font-bold mb-2">✅ User Created:</h3>
              <ul className="text-sm space-y-1">
                <li>ID: {result.signup.user.id}</li>
                <li>Email: {result.signup.user.email}</li>
                <li>Created: {result.signup.user.created_at}</li>
              </ul>
              <p className="text-xs mt-2 text-muted-foreground">
                Check Supabase Dashboard → Authentication → Users to see this user
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <h3 className="font-bold mb-2">Instructions:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Test Supabase Event Connection"</li>
          <li>Open Browser Console (F12) to see detailed logs</li>
          <li>Check the result above</li>
          <li>If signup succeeds, check Supabase Dashboard → Authentication → Users</li>
          <li>Check Supabase Dashboard → Database → Logs for any errors</li>
        </ol>
      </div>
    </div>
  );
}

