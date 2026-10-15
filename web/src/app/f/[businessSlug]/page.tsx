import { notFound } from 'next/navigation';
import { businessService } from '@/services';
import SinglePageReviewFunnel from './SinglePageReviewFunnel';

export default async function FunnelPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const business = await businessService.getBusinessBySlug(businessSlug);

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
