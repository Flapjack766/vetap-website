'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export function ContactForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [ticket, setTicket] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showcaseAnswers, setShowcaseAnswers] = useState<any>(null);

  // Load showcase answers from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('vetap_showcase_answers');
      if (saved) {
        try {
          setShowcaseAnswers(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse showcase answers:', e);
        }
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = (): string | null => {
    if (!formState.name || formState.name.length < 2) {
      return t('A128'); // Please fill in all required fields
    }
    if (!formState.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      return t('A129'); // Please enter a valid email address
    }
    if (!formState.message || formState.message.length < 10) {
      return t('A130'); // Message must be at least 10 characters
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formState,
          locale,
          showcaseAnswers: showcaseAnswers || undefined,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setStatus('success');
        setTicket(data.ticket);
        setFormState({ name: '', email: '', phone: '', message: '' });
        // Clear showcase answers from sessionStorage after successful submission
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('vetap_showcase_answers');
        }
        setShowcaseAnswers(null);
      } else {
        setStatus('error');
        setErrorMessage(data.error || t('A131'));
      }
    } catch {
      setStatus('error');
      setErrorMessage(t('A131')); // Something went wrong
    }
  };

  return (
    <div className="vetap-card mx-auto max-w-2xl">
      {status === 'success' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-12 text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h3 className="mb-2 text-2xl font-bold">{t('A126')}</h3>
          <p className="mb-4 text-muted-foreground">
            {t('A26')} <span className="font-mono font-semibold">{ticket}</span>
          </p>
          <p className="text-sm text-muted-foreground">{t('A27')}</p>
          <Button onClick={() => setStatus('idle')} className="mt-6">
            {t('A25')} {/* Send another message */}
          </Button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t('A21')} *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formState.name}
              onChange={handleChange}
              required
              disabled={status === 'loading'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('A22')} *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              required
              disabled={status === 'loading'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('A123')}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formState.phone}
              onChange={handleChange}
              disabled={status === 'loading'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t('A124')} *</Label>
            <Textarea
              id="message"
              name="message"
              rows={5}
              value={formState.message}
              onChange={handleChange}
              required
              disabled={status === 'loading'}
            />
          </div>

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? (
              <>
                <span className="animate-pulse">{t('A125')}</span>
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t('A25')}
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

