'use client';

import { useEffect, useRef } from 'react';
import { getAnalyticsTracker } from '@/lib/analytics/tracker';

interface AnalyticsTrackerProps {
  profileId: string;
  pagePath: string;
}

export function AnalyticsTracker({ profileId, pagePath }: AnalyticsTrackerProps) {
  const trackedRef = useRef(false);
  const trackerRef = useRef<ReturnType<typeof getAnalyticsTracker> | null>(null);

  useEffect(() => {
    // Only track once per page load
    if (trackedRef.current) return;
    trackedRef.current = true;

    // Initialize advanced analytics tracker
    const tracker = getAnalyticsTracker();
    trackerRef.current = tracker;
    tracker.setProfileId(profileId);

    // Track page view with advanced metrics
    const trackPageView = () => {
      tracker.trackPageView(pagePath, {
        page_title: document.title,
        page_url: window.location.href,
      });
    };

    // Track after a short delay to ensure page is loaded
    const timeout = setTimeout(trackPageView, 500);

    return () => {
      clearTimeout(timeout);
      // Track page exit metrics
      if (trackerRef.current) {
        const metrics = trackerRef.current.getEngagementMetrics();
        trackerRef.current.trackEvent({
          event_type: 'page_exit',
          event_category: 'engagement',
          metadata: metrics,
        });
      }
    };
  }, [profileId, pagePath]);

  return null; // This component doesn't render anything
}

