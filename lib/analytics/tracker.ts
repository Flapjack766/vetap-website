/**
 * Advanced Analytics Tracker
 * Enterprise-grade analytics tracking system with event and conversion tracking
 */

export interface AnalyticsEvent {
  event_type: string;
  event_category?: string;
  event_label?: string;
  event_value?: number;
  page_path?: string;
  metadata?: Record<string, any>;
}

export interface ConversionEvent {
  conversion_type: string;
  conversion_value?: number;
  goal_id?: string;
  metadata?: Record<string, any>;
}

export interface SessionData {
  session_id: string;
  user_id?: string;
  start_time: number;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

class AnalyticsTracker {
  private sessionId: string | null = null;
  private sessionStartTime: number = 0;
  private pageStartTime: number = 0;
  private scrollDepth: number = 0;
  private maxScrollDepth: number = 0;
  private engagementScore: number = 0;
  private eventsQueue: AnalyticsEvent[] = [];
  private isInitialized: boolean = false;
  private profileId: string | null = null;
  private batchSize: number = 10;
  private flushInterval: number = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    if (this.isInitialized) return;
    
    // Get or create session ID
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.pageStartTime = Date.now();

    // Initialize scroll tracking
    this.initScrollTracking();
    
    // Initialize visibility tracking
    this.initVisibilityTracking();
    
    // Initialize click tracking
    this.initClickTracking();
    
    // Initialize form tracking
    this.initFormTracking();
    
    // Start batch flush timer
    this.startBatchFlush();

    this.isInitialized = true;
  }

  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) {
      return stored;
    }
    
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', newSessionId);
    sessionStorage.setItem('analytics_session_start', Date.now().toString());
    return newSessionId;
  }

  private initScrollTracking() {
    const scrollCheckpoints = [25, 50, 75, 90, 100];
    const reachedCheckpoints = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      this.scrollDepth = scrollPercent;
      this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);

      // Track scroll milestones
      scrollCheckpoints.forEach(checkpoint => {
        if (scrollPercent >= checkpoint && !reachedCheckpoints.has(checkpoint)) {
          reachedCheckpoints.add(checkpoint);
          this.trackEvent({
            event_type: 'scroll',
            event_category: 'engagement',
            event_label: `scroll_${checkpoint}%`,
            event_value: checkpoint,
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  private initVisibilityTracking() {
    let isVisible = true;
    let hiddenTime = 0;
    let totalVisibleTime = 0;
    let lastVisibilityChange = Date.now();

    const handleVisibilityChange = () => {
      const now = Date.now();
      
      if (document.hidden) {
        if (isVisible) {
          totalVisibleTime += now - lastVisibilityChange;
          hiddenTime = now;
          isVisible = false;
        }
      } else {
        if (!isVisible) {
          hiddenTime = now - hiddenTime;
          lastVisibilityChange = now;
          isVisible = true;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track time on page when leaving
    window.addEventListener('beforeunload', () => {
      if (isVisible) {
        totalVisibleTime += Date.now() - lastVisibilityChange;
      }
      this.trackEvent({
        event_type: 'page_time',
        event_category: 'engagement',
        event_value: Math.round(totalVisibleTime / 1000), // seconds
      });
    });
  }

  private initClickTracking() {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Track link clicks
      const link = target.closest('a');
      if (link && link.href) {
        const isExternal = link.hostname !== window.location.hostname;
        this.trackEvent({
          event_type: 'click',
          event_category: 'engagement',
          event_label: isExternal ? 'external_link' : 'internal_link',
          metadata: {
            url: link.href,
            text: link.textContent?.trim() || '',
            is_external: isExternal,
          },
        });
      }

      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.closest('button') || target;
        this.trackEvent({
          event_type: 'click',
          event_category: 'engagement',
          event_label: 'button_click',
          metadata: {
            button_text: button.textContent?.trim() || '',
            button_id: button.id || '',
            button_class: button.className || '',
          },
        });
      }
    };

    document.addEventListener('click', handleClick, true);
  }

  private initFormTracking() {
    const handleSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (!form) return;

      const formId = form.id || '';
      const formName = form.name || '';
      
      this.trackEvent({
        event_type: 'form_submit',
        event_category: 'conversion',
        event_label: formId || formName || 'form',
        metadata: {
          form_id: formId,
          form_name: formName,
          form_action: form.action || '',
        },
      });
    };

    const handleFocus = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT')) {
        this.trackEvent({
          event_type: 'form_interaction',
          event_category: 'engagement',
          event_label: 'form_field_focus',
          metadata: {
            field_name: input.name || '',
            field_type: input.type || '',
            form_id: input.form?.id || '',
          },
        });
      }
    };

    document.addEventListener('submit', handleSubmit, true);
    document.addEventListener('focusin', handleFocus, true);
  }

  private startBatchFlush() {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private async flushEvents() {
    if (this.eventsQueue.length === 0) return;
    if (!this.profileId) return;

    const eventsToFlush = this.eventsQueue.splice(0, this.batchSize);
    
    try {
      await Promise.all(
        eventsToFlush.map(event => this.sendEvent(event))
      );
    } catch (error) {
      console.error('Error flushing events:', error);
      // Re-add events to queue on error
      this.eventsQueue.unshift(...eventsToFlush);
    }
  }

  public setProfileId(profileId: string) {
    this.profileId = profileId;
  }

  public trackPageView(pagePath: string, metadata?: Record<string, any>) {
    this.pageStartTime = Date.now();
    
    const event: AnalyticsEvent = {
      event_type: 'page_view',
      page_path: pagePath,
      metadata: {
        ...metadata,
        referrer: document.referrer || '',
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    this.queueEvent(event);
  }

  public trackEvent(event: AnalyticsEvent) {
    this.queueEvent(event);
    this.updateEngagementScore(event);
  }

  public trackConversion(conversion: ConversionEvent) {
    if (!this.profileId) {
      console.warn('Profile ID not set, cannot track conversion');
      return;
    }

    const event: AnalyticsEvent = {
      event_type: 'conversion',
      event_category: 'conversion',
      event_label: conversion.conversion_type,
      event_value: conversion.conversion_value,
      metadata: {
        ...conversion.metadata,
        goal_id: conversion.goal_id,
        conversion_type: conversion.conversion_type,
      },
    };

    this.queueEvent(event);
    this.sendConversion(conversion);
  }

  public trackGoal(goalId: string, goalValue?: number, metadata?: Record<string, any>) {
    this.trackConversion({
      conversion_type: 'goal',
      conversion_value: goalValue,
      goal_id: goalId,
      metadata,
    });
  }

  private queueEvent(event: AnalyticsEvent) {
    this.eventsQueue.push(event);
    
    // Flush immediately if queue is full
    if (this.eventsQueue.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  private updateEngagementScore(event: AnalyticsEvent) {
    const scoreMap: Record<string, number> = {
      'page_view': 1,
      'scroll': 0.5,
      'click': 2,
      'form_interaction': 3,
      'form_submit': 10,
      'conversion': 20,
    };

    const score = scoreMap[event.event_type] || 0;
    this.engagementScore += score;
  }

  private async sendEvent(event: AnalyticsEvent) {
    if (!this.profileId) return;

    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id: this.profileId,
          event_type: event.event_type,
          event_category: event.event_category,
          event_label: event.event_label,
          event_value: event.event_value,
          page_path: event.page_path || window.location.pathname,
          session_id: this.sessionId,
          metadata: event.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track event');
      }
    } catch (error) {
      console.error('Error sending analytics event:', error);
      throw error;
    }
  }

  private async sendConversion(conversion: ConversionEvent) {
    if (!this.profileId) return;

    try {
      const response = await fetch('/api/analytics/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id: this.profileId,
          conversion_type: conversion.conversion_type,
          conversion_value: conversion.conversion_value,
          goal_id: conversion.goal_id,
          session_id: this.sessionId,
          metadata: conversion.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to track conversion');
      }
    } catch (error) {
      console.error('Error sending conversion:', error);
    }
  }

  public getSessionData(): SessionData {
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      session_id: this.sessionId || '',
      start_time: this.sessionStartTime,
      referrer: document.referrer || undefined,
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      utm_term: urlParams.get('utm_term') || undefined,
      utm_content: urlParams.get('utm_content') || undefined,
    };
  }

  public getEngagementMetrics() {
    const timeOnPage = Math.round((Date.now() - this.pageStartTime) / 1000);
    
    return {
      engagement_score: this.engagementScore,
      time_on_page: timeOnPage,
      max_scroll_depth: this.maxScrollDepth,
      session_duration: Math.round((Date.now() - this.sessionStartTime) / 1000),
    };
  }

  public destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushEvents();
    this.isInitialized = false;
  }
}

// Singleton instance
let trackerInstance: AnalyticsTracker | null = null;

export function getAnalyticsTracker(): AnalyticsTracker {
  if (typeof window === 'undefined') {
    // Server-side: return a mock tracker
    return {} as AnalyticsTracker;
  }
  
  if (!trackerInstance) {
    trackerInstance = new AnalyticsTracker();
  }
  
  return trackerInstance;
}

export default getAnalyticsTracker;

