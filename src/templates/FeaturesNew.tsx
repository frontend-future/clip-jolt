import { CheckCircle2, Sparkles, Star } from 'lucide-react';

import { Section } from '@/features/landing/Section';

export const FeaturesNew = () => {
  return (
    <>
      {/* Product Showcase Section */}
      <Section className="py-20">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 p-8">
              {/* Placeholder for product screenshot */}
              <div className="flex h-full items-center justify-center text-gray-400">
                <span className="text-lg">Product Demo Area</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Benefits Section */}
      <Section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <span className="inline-block rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white">
              Key Benefits
            </span>
          </div>

          <h2 className="mb-4 text-4xl font-bold tracking-tight text-black">
            Your Website Should Be Clear, Not Confusing
          </h2>

          <div className="mt-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle2 className="size-5 text-blue-600" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-black">
                  Markup Layouts
                </h3>
                <p className="text-gray-600">
                  Your website feels cluttered. Our template's clean sections guide users easily.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Sparkles className="size-5 text-blue-600" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-black">
                  Poor User Experience
                </h3>
                <p className="text-gray-600">
                  Navigation is confusing. This template makes everything clear and intuitive.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Star className="size-5 text-blue-600" />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-black">
                  Boring, Static Design
                </h3>
                <p className="text-gray-600">
                  There's less interest already. Add interactive features to keep them engaged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Interactive Elements Section */}
      <Section className="py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6">
            <span className="inline-block rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white">
              Features
            </span>
          </div>

          <h2 className="mb-12 text-4xl font-bold tracking-tight text-black">
            Interactive & Engaging Components
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 text-sm font-medium text-white shadow-lg">
              Poor Analytics
            </span>
            <span className="rounded-full bg-gradient-to-r from-green-400 to-emerald-500 px-6 py-3 text-sm font-medium text-white shadow-lg">
              Customer Confusion
            </span>
            <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-medium text-white shadow-lg">
              No Strategy
            </span>
            <span className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-medium text-white shadow-lg">
              No Ideas
            </span>
            <span className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-medium text-white shadow-lg">
              Engaging Content
            </span>
          </div>
        </div>
      </Section>
    </>
  );
};
