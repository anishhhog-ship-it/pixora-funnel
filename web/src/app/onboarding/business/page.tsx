import { redirect } from 'next/navigation';
import { getCanonicalOnboardingHref } from '../legacyStepRedirect';
import type { OnboardingSearchParams } from '../legacyStepRedirect';

export default async function BusinessStepPage({
  searchParams,
}: {
  searchParams: Promise<OnboardingSearchParams>;
}) {
  redirect(getCanonicalOnboardingHref(await searchParams));
}
