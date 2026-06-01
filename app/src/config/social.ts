/**
 * Social media links configuration
 * Shared across Rabbit Hole Inc properties
 */

export interface SocialLink {
  platform: string;
  href: string;
  label: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { platform: 'x', href: 'https://x.com/rabbitholewun', label: 'X (Twitter)' },
  { platform: 'github', href: 'https://github.com/framerslab', label: 'GitHub' },
  { platform: 'discord', href: 'https://wilds.ai/discord', label: 'Discord' },
  { platform: 'linkedin', href: 'https://linkedin.com/company/framerslab', label: 'LinkedIn' },
  { platform: 'youtube', href: 'https://youtube.com/@rabbitholewun', label: 'YouTube' },
];
