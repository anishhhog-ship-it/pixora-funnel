import { notFound } from 'next/navigation';
import { getPublicFunnelResolution } from '@/services/publicFunnelResolver';
import SinglePageReviewFunnel from './SinglePageReviewFunnel';

export default async function FunnelPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const resolution = await getPublicFunnelResolution(businessSlug);
  const business = resolution.business;

  if (!business) {
    notFound();
  }

  return (
    <SinglePageReviewFunnel
      initialBusiness={business}
      businessSlug={businessSlug}
    />
  );
}
