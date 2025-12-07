'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/app/(components)/ui/button';
import { Textarea } from '@/app/(components)/ui/textarea';
import { Star, Loader2, ExternalLink } from 'lucide-react';
import { RestaurantTemplate1 } from '@/app/(components)/tracking/restaurant-templates/RestaurantTemplate1';
import { MenuTemplate1 } from '@/app/(components)/tracking/menu-templates/MenuTemplate1';

interface FeedbackFormData {
  rating: number | null;
  comment: string;
}

export interface LinkData {
  trackingLink: {
    id: string;
    slug: string;
    destination_type: string;
    destination_url: string;
    show_intermediate_page: boolean;
    collect_feedback_first: boolean;
    selected_template: string | null;
  };
  branch: {
    id: string;
    name: string;
    address: string | null;
    google_maps_url: string | null;
  } | null;
  business: {
    id: string;
    name: string;
    industry: string | null;
  } | null;
  templateData?: Record<string, unknown> | null;
}

interface TrackingLinkClientProps {
  slug: string;
  linkData: LinkData;
  requireFeedback: boolean;
  showTemplate: boolean;
  destinationUrl: string;
}

export default function TrackingLinkClient({
  slug,
  linkData,
  requireFeedback,
  showTemplate,
  destinationUrl,
}: TrackingLinkClientProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackFormData>({
    rating: null,
    comment: '',
  });
  const templateData = (linkData.templateData ?? {}) as Record<string, unknown>;

  useEffect(() => {
    if (!requireFeedback && !showTemplate) {
      window.location.href = destinationUrl;
    }
  }, [requireFeedback, showTemplate, destinationUrl]);

  const handleRatingClick = (rating: number) => {
    setFeedback((prev) => ({ ...prev, rating }));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback((prev) => ({ ...prev, comment: e.target.value }));
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.rating) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/tracking/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          rating: feedback.rating,
          comment: feedback.comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      window.location.href = destinationUrl;
    } catch (err) {
      console.error('Error submitting feedback:', err);
      const message = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(message);
      setSubmitting(false);
    }
  };

  const handleSkipFeedback = () => {
    window.location.href = destinationUrl;
  };

  // Ensure first render on the client matches the server markup
  // We render a simple loader until hydration is complete, then show the full UI.
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requireFeedback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {linkData.business?.name || 'Share Your Experience'}
            </CardTitle>
            <CardDescription className="text-center">
              {linkData.branch?.name
                ? `How was your experience at ${linkData.branch.name}?`
                : 'We value your feedback'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className={`transition-all ${
                    feedback.rating && feedback.rating >= star
                      ? 'text-yellow-500 scale-110'
                      : 'text-muted-foreground hover:text-yellow-400'
                  }`}
                  disabled={submitting}
                >
                  <Star
                    className={`h-10 w-10 ${
                      feedback.rating && feedback.rating >= star ? 'fill-current' : ''
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                Additional Comments (Optional)
              </label>
              <Textarea
                id="comment"
                placeholder="Tell us more about your experience..."
                value={feedback.comment}
                onChange={handleCommentChange}
                rows={4}
                disabled={submitting}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {feedback.comment.length}/500
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSubmitFeedback}
                disabled={submitting || !feedback.rating}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit & Continue
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleSkipFeedback} disabled={submitting}>
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showTemplate && linkData && destinationUrl) {
    const templateName = linkData.trackingLink.selected_template || '';
    const handleContinue = () => {
      window.location.href = destinationUrl;
    };

    // Restaurant templates (1-5) - currently all use the same base layout component
    if (templateName.startsWith('restaurant-template-')) {
      const templateNumber = Number(templateName.match(/\d+/)?.[0] || '1');
      return (
        <RestaurantTemplate1
          businessName={linkData.business?.name || 'Business'}
          branchName={linkData.branch?.name || undefined}
          address={linkData.branch?.address || undefined}
          googleMapsUrl={linkData.branch?.google_maps_url || undefined}
          destinationUrl={destinationUrl}
          onContinue={handleContinue}
          templateVariant={templateNumber}
          primaryColor={typeof templateData.primary_color === 'string' ? (templateData.primary_color as string) : undefined}
          accentColor={typeof templateData.accent_color === 'string' ? (templateData.accent_color as string) : undefined}
          backgroundColor={typeof templateData.background_color === 'string' ? (templateData.background_color as string) : undefined}
          textColor={typeof templateData.text_color === 'string' ? (templateData.text_color as string) : undefined}
          heroOverlayColor={typeof templateData.hero_overlay_color === 'string' ? (templateData.hero_overlay_color as string) : undefined}
          pageBackgroundImage={
            typeof templateData.page_background_image === 'string'
              ? (templateData.page_background_image as string)
              : undefined
          }
          menuPageUrl={
            typeof templateData.menu_page_url === 'string'
              ? (templateData.menu_page_url as string)
              : undefined
          }
          showMap={templateData.show_map === true}
          socialMediaLinks={
            typeof templateData.social_media_links === 'object' && templateData.social_media_links !== null
              ? (templateData.social_media_links as {
                  facebook?: string;
                  instagram?: string;
                  twitter?: string;
                  linkedin?: string;
                  youtube?: string;
                  tiktok?: string;
                })
              : undefined
          }
        />
      );
    }

    // Menu templates (1-5) - currently all use the same base layout component
    if (templateName.startsWith('menu-template-')) {
      const templateNumber = Number(templateName.match(/\d+/)?.[0] || '1');
      const menuItems = Array.isArray(templateData.menu_items)
        ? (templateData.menu_items as Array<{
            name: string;
            description?: string;
            price?: string;
            image?: string;
            category?: string;
          }>)
        : undefined;
      return (
        <MenuTemplate1
          businessName={linkData.business?.name || 'Business'}
          branchName={linkData.branch?.name || undefined}
          address={linkData.branch?.address || undefined}
          googleMapsUrl={linkData.branch?.google_maps_url || undefined}
          operatingHours={
            typeof templateData.operating_hours === 'string'
              ? (templateData.operating_hours as string)
              : undefined
          }
          description={
            typeof templateData.description === 'string'
              ? (templateData.description as string)
              : undefined
          }
          menuImage={
            typeof templateData.menu_image === 'string'
              ? (templateData.menu_image as string)
              : undefined
          }
          menuItems={menuItems}
          externalMenuUrl={
            typeof templateData.external_menu_url === 'string'
              ? (templateData.external_menu_url as string)
              : undefined
          }
          destinationUrl={destinationUrl}
          onContinue={handleContinue}
          templateVariant={templateNumber}
        />
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl">
                {linkData.business?.name || 'Welcome'}
              </CardTitle>
              <CardDescription>
                {linkData.branch?.name
                  ? `Visit us at ${linkData.branch.name}`
                  : 'Thank you for visiting'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                You're being redirected to our location...
              </p>
              <Button onClick={handleContinue} className="w-full" size="lg">
                Continue to Destination
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

