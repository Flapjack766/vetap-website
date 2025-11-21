'use client';

import { useEffect, useRef } from 'react';

interface AnalyticsTrackerProps {
  profileId: string;
  pagePath: string;
}

export function AnalyticsTracker({ profileId, pagePath }: AnalyticsTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (trackedRef.current) return;
    trackedRef.current = true;

    // Generate or get session ID
    const getSessionId = () => {
      const stored = sessionStorage.getItem('analytics_session_id');
      if (stored) return stored;
      
      const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', newSessionId);
      return newSessionId;
    };

    const trackPageView = async () => {
      try {
        const sessionId = getSessionId();
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;

        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: profileId,
            event_type: 'page_view',
            page_path: pagePath,
            session_id: sessionId,
            screen_width: screenWidth,
            screen_height: screenHeight,
          }),
        });
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.error('Analytics tracking error:', error);
      }
    };

    // Track after a short delay to ensure page is loaded
    const timeout = setTimeout(trackPageView, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [profileId, pagePath]);

  return null; // This component doesn't render anything
}

