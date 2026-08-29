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
    { href: '#', label: 'Home', index: '01', current: true },
    { href: '#about', label: 'About', index: '02', current: false },
    { href: '#lab', label: 'Lab', index: '03', current: false },
  ],
} as const;

export const navigationItems = siteContent.navigation;
