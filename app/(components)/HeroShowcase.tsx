'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

type Answer = {
  industry?: string;
  industryOther?: string;
  services?: string[];
  budget?: string;
  speed?: string;
};

export function HeroShowcase() {
  const t = useTranslations();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer>({});
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [industryOtherText, setIndustryOtherText] = useState('');

  const questions = [
    {
      key: 'industry',
      label: t('A10'), // Your industry
      multiple: false,
      options: [
        { value: 'ecommerce', label: t('A37') },
        { value: 'corporate', label: t('A38') },
        { value: 'portfolio', label: t('A39') },
        { value: 'saas', label: t('A40') },
        { value: 'other', label: t('A41') },
      ],
    },
    {
      key: 'services',
      label: t('A200'), // Required service
      multiple: true,
      options: [
        { value: 'websites', label: t('A201') },
        { value: 'nfc-business-card', label: t('A202') },
        { value: 'nfc-google-maps', label: t('A203') },
      ],
    },
    {
      key: 'budget',
      label: t('A11'), // Budget range
      multiple: false,
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
      multiple: false,
      options: [
        { value: 'standard', label: t('A46') },
        { value: 'fast', label: t('A47') },
        { value: 'express', label: t('A48') },
      ],
    },
  ];

  const getNextStep = (currentStep: number) => {
    // If we're on services question (step 1)
    if (currentStep === 1) {
      const selectedServices = answers.services || [];
      // If "websites" is selected, go to budget (step 2)
      if (selectedServices.includes('websites')) {
        return 2; // budget question
      } else {
        // Skip budget and speed, go directly to recommendation
        return -1; // -1 means show recommendation
      }
    }
    
    // For other questions, just go to next step
    if (currentStep < questions.length - 1) {
      return currentStep + 1;
    }
    
    return -1; // Show recommendation
  };

  const handleAnswer = (key: string, value: string) => {
    const currentQuestion = questions[step];
    
    if (currentQuestion.multiple) {
      // Handle multiple selection
      const currentServices = (answers.services || []) as string[];
      const newServices = currentServices.includes(value)
        ? currentServices.filter((s) => s !== value)
        : [...currentServices, value];
      
      setAnswers({ ...answers, [key]: newServices });
    } else {
      // Handle single selection
      if (key === 'industry' && value === 'other') {
        // Don't move to next step yet, wait for user to enter text
        setAnswers({ ...answers, [key]: value });
      } else {
        setAnswers({ ...answers, [key]: value });
        
        // Move to next question
        const nextStep = getNextStep(step);
        if (nextStep === -1) {
          setTimeout(() => setShowRecommendation(true), 200);
        } else {
          setTimeout(() => setStep(nextStep), 200);
        }
      }
    }
  };

  const handleIndustryOtherSubmit = () => {
    if (industryOtherText.trim()) {
      setAnswers({ ...answers, industry: 'other', industryOther: industryOtherText.trim() });
      const nextStep = getNextStep(step);
      if (nextStep === -1) {
        setTimeout(() => setShowRecommendation(true), 200);
      } else {
        setTimeout(() => setStep(nextStep), 200);
      }
    }
  };

  const handleNext = () => {
    const currentQuestion = questions[step];
    if (currentQuestion.multiple) {
      const selectedServices = answers.services || [];
      if (selectedServices.length > 0) {
        const nextStep = getNextStep(step);
        if (nextStep === -1) {
          setTimeout(() => setShowRecommendation(true), 200);
        } else {
          setTimeout(() => setStep(nextStep), 200);
        }
      }
    }
  };

  const getRecommendation = () => {
    const budget = answers.budget;
    const services = answers.services || [];
    
    // If no budget (skipped questions), show general recommendation
    if (!budget) {
      if (services.includes('websites')) {
        return { package: t('A50'), description: t('A53') }; // Starter as default
      } else {
        return { package: t('A205'), description: t('A206') }; // Custom package for NFC services
      }
    }
    
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
    setIndustryOtherText('');
    setShowRecommendation(false);
    // Clear saved answers from sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('vetap_showcase_answers');
    }
  };

  // Save answers to sessionStorage when recommendation is shown
  useEffect(() => {
    if (showRecommendation) {
      const answersToSave = {
        industry: answers.industry,
        industryOther: answers.industryOther,
        services: answers.services,
        budget: answers.budget,
        speed: answers.speed,
      };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('vetap_showcase_answers', JSON.stringify(answersToSave));
      }
    }
  }, [showRecommendation, answers]);

  const goBack = () => {
    if (step > 0) {
      // If going back from services question, need to handle step calculation
      if (step === 1) {
        setStep(0);
      } else if (step === 2 || step === 3) {
        // If we're on budget or speed, go back to services
        setStep(1);
      } else {
        setStep(step - 1);
      }
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
                  
                  {/* Show input field if "other" is selected in industry question */}
                  {step === 0 && answers.industry === 'other' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={industryOtherText}
                        onChange={(e) => setIndustryOtherText(e.target.value)}
                        placeholder={t('A204')}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && industryOtherText.trim()) {
                            handleIndustryOtherSubmit();
                          }
                        }}
                      />
                      <Button
                        onClick={handleIndustryOtherSubmit}
                        disabled={!industryOtherText.trim()}
                        className="w-full"
                      >
                        {t('A56')}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Show options if not "other" input mode */}
                  {!(step === 0 && answers.industry === 'other') && (
                    <>
                      <div className="grid gap-3">
                        {questions[step].options.map((option) => {
                          const isSelected = questions[step].multiple
                            ? (answers[questions[step].key as keyof Answer] as string[])?.includes(option.value)
                            : answers[questions[step].key as keyof Answer] === option.value;
                          
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleAnswer(questions[step].key, option.value)}
                              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background hover:border-primary hover:bg-accent'
                              }`}
                            >
                              <span>{option.label}</span>
                              {questions[step].multiple ? (
                                <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                                }`}>
                                  {isSelected && (
                                    <svg className="h-3 w-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {questions[step].multiple && (
                        <div className="mt-4">
                          <Button
                            onClick={handleNext}
                            disabled={!answers.services || (answers.services as string[]).length === 0}
                            className="w-full"
                          >
                            {t('A56')}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
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

                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button asChild className="flex-1">
                        <Link href="/contact">
                          {t('A14')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      {(() => {
                        const services = answers.services || [];
                        const hasNFCBusinessCard = services.includes('nfc-business-card');
                        const hasNFCGoogleMaps = services.includes('nfc-google-maps');
                        
                        if (hasNFCBusinessCard && !hasNFCGoogleMaps) {
                          // Only business card selected
                          return (
                            <Button asChild variant="outline" className="flex-1">
                              <Link href="/business-card">
                                {t('A208')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          );
                        } else if (hasNFCGoogleMaps && !hasNFCBusinessCard) {
                          // Only Google Maps review card selected
                          return (
                            <Button asChild variant="outline" className="flex-1">
                              <Link href="/review-card">
                                {t('A209')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          );
                        } else if (hasNFCBusinessCard && hasNFCGoogleMaps) {
                          // Both selected - show both options
                          return (
                            <>
                              <Button asChild variant="outline" className="flex-1">
                                <Link href="/business-card">
                                  {t('A208')}
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                              <Button asChild variant="outline" className="flex-1">
                                <Link href="/review-card">
                                  {t('A209')}
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <Button variant="outline" onClick={reset} className="w-full">
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

