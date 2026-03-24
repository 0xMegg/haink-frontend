export function buildOnboardingRedirectPath(from: string) {
  const params = new URLSearchParams({
    from,
    reason: 'incomplete_setup',
  });

  return `/onboarding?${params.toString()}`;
}
