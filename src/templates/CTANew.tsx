import { BookOpen, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Section } from '@/features/landing/Section';

export const CTANew = () => {
  const t = useTranslations('CTA');

  return (
    <Section className="py-20">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        {/* Write & Schedule Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex size-12 items-center justify-center rounded-full bg-blue-100">
            <BookOpen className="size-6 text-blue-600" />
          </div>
          
          <h3 className="mb-3 text-2xl font-bold text-black">
            Write & Schedule with Ease
          </h3>
          
          <p className="mb-6 text-gray-600">
            Effortlessly create and organize content, perfect for blogs, landing pages, and more.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block size-2 rounded-full bg-blue-600" />
              <span className="text-gray-700">Bilingual</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block size-2 rounded-full bg-blue-600" />
              <span className="text-gray-700">Taylor</span>
            </div>
          </div>
        </div>

        {/* Publish Anywhere Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex size-12 items-center justify-center rounded-full bg-blue-100">
            <Share2 className="size-6 text-blue-600" />
          </div>
          
          <h3 className="mb-3 text-2xl font-bold text-black">
            Publish Anywhere
          </h3>
          
          <p className="mb-6 text-gray-600">
            Share content across multiple platforms like LinkedIn, your blog, or newsletters, for extra setup.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block size-2 rounded-full bg-blue-600" />
              <span className="text-gray-700">Kelly</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-block size-2 rounded-full bg-blue-600" />
              <span className="text-gray-700">This is awesome!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Cards */}
      <div className="mx-auto mt-8 grid max-w-6xl gap-8 md:grid-cols-2">
        {/* Get Smarter Content Card */}
        <div className="rounded-2xl bg-gray-50 p-8">
          <h3 className="mb-3 text-xl font-bold text-black">
            Get Smarter Content Suggestions
          </h3>
          
          <p className="text-sm text-gray-600">
            Leverage AI tools to get personalized content recommendations for your niche.
          </p>
        </div>

        {/* Gather Instant User Insights Card */}
        <div className="rounded-2xl bg-gray-50 p-8">
          <h3 className="mb-3 text-xl font-bold text-black">
            Gather Instant User Insights
          </h3>
          
          <p className="text-sm text-gray-600">
            Collect and analyze user feedback instantly to drive your site with built-in tools.
          </p>
        </div>
      </div>
    </Section>
  );
};
