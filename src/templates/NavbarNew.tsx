import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredMenu } from '@/features/landing/CenteredMenu';
import { Section } from '@/features/landing/Section';

import { Logo } from './Logo';

export const NavbarNew = () => {
  const t = useTranslations('Navbar');

  return (
    <Section className="border-b border-gray-200 px-3 py-4">
      <CenteredMenu
        logo={<Logo />}
        rightMenu={(
          <>
            <li data-fade>
              <LocaleSwitcher />
            </li>
            <li className="ml-1 mr-2.5" data-fade>
              <Link href="/sign-in" className="text-sm text-gray-700 hover:text-black">
                {t('sign_in')}
              </Link>
            </li>
            <li>
              <Link 
                className={buttonVariants({ 
                  size: 'default',
                  className: 'bg-blue-600 hover:bg-blue-700 text-white text-sm'
                })} 
                href="/sign-up"
              >
                {t('sign_up')}
              </Link>
            </li>
          </>
        )}
      >
        <li>
          <Link href="#about" className="text-sm text-gray-700 hover:text-black">
            About
          </Link>
        </li>

        <li>
          <Link href="#solution" className="text-sm text-gray-700 hover:text-black">
            Solution
          </Link>
        </li>

        <li>
          <Link href="#pricing" className="text-sm text-gray-700 hover:text-black">
            Pricing
          </Link>
        </li>
      </CenteredMenu>
    </Section>
  );
};
