export type OnboardingSearchParams = Record<string, string | string[] | undefined>;

/** Preserve deep-link context while routing legacy steps to the one canonical flow. */
export function getCanonicalOnboardingHref(searchParams: OnboardingSearchParams = {}): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const serialized = query.toString();
  return serialized ? `/onboarding?${serialized}` : '/onboarding';
}
