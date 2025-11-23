'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export function Testimonials() {
  const t = useTranslations();

  const testimonials = [
    {
      quote: t('A95'),
      author: t('A96'),
      role: t('A97'),
    },
    {
      quote: t('A98'),
      author: t('A99'),
      role: t('A100'),
    },
    {
      quote: t('A101'),
      author: t('A102'),
      role: t('A103'),
    },
  ];

  return (
    <section className="vetap-section">
      <div className="vetap-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('A94')}</h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="vetap-card"
            >
              <Quote className="mb-4 h-8 w-8 text-primary/40" />
              <p className="mb-6 text-muted-foreground">{testimonial.quote}</p>
              <div>
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

