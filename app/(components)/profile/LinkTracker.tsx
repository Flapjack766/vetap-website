'use client';

import { useCallback } from 'react';

interface LinkTrackerProps {
  profileId: string;
  linkUrl: string;
  linkType: string;
  children: React.ReactNode;
}

export function LinkTracker({ profileId, linkUrl, linkType, children }: LinkTrackerProps) {
  const handleClick = useCallback(async () => {
    try {
      // Get session ID
      const sessionId = sessionStorage.getItem('analytics_session_id') || 
        `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!sessionStorage.getItem('analytics_session_id')) {
        sessionStorage.setItem('analytics_session_id', sessionId);
      }

      // Track link click
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id: profileId,
          event_type: 'link_click',
          page_path: window.location.pathname,
          link_url: linkUrl,
          link_type: linkType,
          session_id: sessionId,
        }),
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.error('Link tracking error:', error);
    }
  }, [profileId, linkUrl, linkType]);

  // Clone the child element and add onClick handler
  if (typeof children === 'object' && children !== null && 'props' in children) {
    return (
      <div onClick={handleClick}>
        {children}
      </div>
    );
  }

  return <div onClick={handleClick}>{children}</div>;
}

