export type FooterLink = {
  id: string;
  label: string;
  url: string;
  icon: string;
  newTab: boolean;
  enabled: boolean;
};

export type FooterSettings = {
  id: number;
  links: FooterLink[];
  updated_at: string;
};

const URL_PATTERN = /^https:\/\/.+/i;
const ICONS = new Set(['link', 'github', 'linkedin', 'youtube', 'instagram', 'x', 'discord', 'facebook', 'tiktok', 'website', 'email']);

export function normalizeFooterLinks(value: unknown): FooterLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const link = item as Record<string, unknown>;
    const label = typeof link.label === 'string' ? link.label.trim() : '';
    const url = typeof link.url === 'string' ? link.url.trim() : '';
    if (!label || label.length > 80 || !URL_PATTERN.test(url) || url.length > 500) return [];
    return [{
      id: typeof link.id === 'string' && link.id ? link.id : crypto.randomUUID(),
      label,
      url,
      icon: typeof link.icon === 'string' && ICONS.has(link.icon) ? link.icon : 'link',
      newTab: link.newTab === true,
      enabled: link.enabled !== false,
    }];
  });
}

export const footerIconOptions = ['link', 'github', 'linkedin', 'youtube', 'instagram', 'x', 'discord', 'facebook', 'tiktok', 'website', 'email'] as const;
