'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

type Answer = {
  industry?: string;
  budget?: string;
  speed?: string;
};

export function HeroShowcase() {
  const t = useTranslations();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer>({});
  const [showRecommendation, setShowRecommendation] = useState(false);

  const questions = [
    {
      key: 'industry',
      label: t('A10'), // Your industry
      options: [
        { value: 'ecommerce', label: t('A37') },
        { value: 'corporate', label: t('A38') },
        { value: 'portfolio', label: t('A39') },
        { value: 'saas', label: t('A40') },
        { value: 'other', label: t('A41') },
      ],
    },
    {
      key: 'budget',
      label: t('A11'), // Budget range
      options: [
        { value: 'under-5k', label: t('A42') },
        { value: '5k-15k', label: t('A43') },
        { value: '15k-50k', label: t('A44') },
        { value: '50k+', label: t('A45') },
      ],
    },
    {
      key: 'speed',
      label: t('A12'), // Speed requirement
      options: [
        { value: 'standard', label: t('A46') },
        { value: 'fast', label: t('A47') },
        { value: 'express', label: t('A48') },
      ],
    },
  ];

  const handleAnswer = (key: string, value: string) => {
    setAnswers({ ...answers, [key]: value });
    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 200);
    } else {
      setTimeout(() => setShowRecommendation(true), 200);
    }
  };

  const getRecommendation = () => {
    const budget = answers.budget;
    if (budget === 'under-5k' || budget === '5k-15k') {
      return { package: t('A50'), description: t('A53') }; // Starter
    } else if (budget === '15k-50k') {
      return { package: t('A51'), description: t('A54') }; // Professional
    } else {
      return { package: t('A52'), description: t('A55') }; // Enterprise
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setShowRecommendation(false);
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setShowRecommendation(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
      <div className="vetap-container vetap-section">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              {t('A1')}
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">{t('A2')}</p>
          </motion.div>

          {/* Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="vetap-card mx-auto max-w-2xl"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">{t('A8')}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t('A9')}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>
                  {t('A59')} {step + 1} / {questions.length}
                </span>
                {showRecommendation && <span>{t('A126')}</span>}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: showRecommendation ? '100%' : `${((step + 1) / questions.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Questions */}
            <AnimatePresence mode="wait">
              {!showRecommendation ? (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-medium">{questions[step].label}</h3>
                  <div className="grid gap-3">
                    {questions[step].options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(questions[step].key, option.value)}
                        className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left transition-all hover:border-primary hover:bg-accent"
                      >
                        <span>{option.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="recommendation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{t('A49')}</p>
                    <h3 className="mt-2 text-3xl font-bold">{getRecommendation().package}</h3>
                    <p className="mt-2 text-muted-foreground">{getRecommendation().description}</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="flex-1">
                      <Link href="/contact">
                        {t('A14')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={reset} className="flex-1">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {t('A58')}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            {!showRecommendation && step > 0 && (
              <div className="mt-6">
                <Button variant="ghost" onClick={goBack} size="sm">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {t('A57')}
                </Button>
              </div>
            )}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-muted-foreground">
              {t('A35')}{' '}
              <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
                {t('A20')}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

