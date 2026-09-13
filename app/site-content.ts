// Temporary content source. This shape can later be replaced by database or CMS data.
export const siteContent = {
  brand: 'FAH / 001',
  profile: {
    firstName: 'Fadi',
    lastName: 'Al Hazim',
    role: 'Computer Engineer',
    kicker: "Hello, I'm",
    portrait: {
      src: '/fadi-gray-suit.jpg',
      alt: 'Fadi Al Hazim wearing a gray suit',
    },
  },
  navigation: [
    { href: '/', label: 'Home', index: '01', current: true, disabled: false },
    { href: '/about', label: 'About', index: '02', current: false, disabled: false },
    { href: '/journey', label: 'Journey', index: '03', current: false, disabled: false },
    { href: '/projects', label: 'Projects', index: '04', current: false, disabled: false },
    { href: '/experiences', label: 'Experience', index: '05', current: false, disabled: false },
    { href: '/contact', label: 'Contact', index: '06', current: false, disabled: false },
  ],
} as const;

export const navigationItems = siteContent.navigation;
