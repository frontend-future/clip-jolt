import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { CTANew } from '@/templates/CTANew';
import { DemoBanner } from '@/templates/DemoBanner';
import { FeaturesNew } from '@/templates/FeaturesNew';
import { FooterNew } from '@/templates/FooterNew';
import { HeroNew } from '@/templates/HeroNew';
import { NavbarNew } from '@/templates/NavbarNew';
import { StatsSection } from '@/templates/StatsSection';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const IndexPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      <DemoBanner />
      <NavbarNew />
      <HeroNew />
      <FeaturesNew />
      <StatsSection />
      <CTANew />
      <FooterNew />
    </>
  );
};

export default IndexPage;
