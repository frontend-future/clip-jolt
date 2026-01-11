import { useTranslations } from 'next-intl';

import { badgeVariants } from '@/components/ui/badgeVariants';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredHero } from '@/features/landing/CenteredHero';
import { Section } from '@/features/landing/Section';

export const HeroNew = () => {
  const t = useTranslations('Hero');

  return (
    <Section className="py-20">
      <CenteredHero
        banner={(
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-medium">
            <span className="flex -space-x-2">
              <span className="inline-block size-6 rounded-full bg-gray-300 ring-2 ring-white" />
              <span className="inline-block size-6 rounded-full bg-gray-400 ring-2 ring-white" />
              <span className="inline-block size-6 rounded-full bg-gray-500 ring-2 ring-white" />
            </span>
            <span>Join 30+ members</span>
            <span className="text-yellow-600">✨ Join Waitlist</span>
          </div>
        )}
        title={(
          <span className="text-5xl font-bold leading-tight tracking-tight text-black md:text-6xl">
            A Simple Template for Your
            <br />
            SaaS Success
          </span>
        )}
        description="Ready-made sections, interactive layouts, and modern design—all in one template to elevate your SaaS landing page."
        buttons={(
          <>
            <a
              className={buttonVariants({ size: 'lg', className: 'bg-blue-600 hover:bg-blue-700 text-white' })}
              href="/sign-up"
            >
              Buy Template
            </a>

            <a
              className={buttonVariants({ variant: 'outline', size: 'lg', className: 'border-gray-300 text-black hover:bg-gray-50' })}
              href="#features"
            >
              See Solution
            </a>
          </>
        )}
      />
      
      {/* Logo Cloud */}
      <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale">
        <div className="text-sm font-medium">Trusted by</div>
        <div className="text-sm font-semibold">Catalog</div>
        <div className="text-sm font-semibold">FeatherDev</div>
        <div className="text-sm font-semibold">FocalPoint</div>
        <div className="text-sm font-semibold">Prism</div>
      </div>
    </Section>
  );
};
