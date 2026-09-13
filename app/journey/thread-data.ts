export type JourneyThread = {
  number: string;
  slug: string;
  title: string;
  description: string;
  subthreads: number;
  visual: string;
};

export const journeyThreads: JourneyThread[] = [
  { number: '01', slug: 'cooking', title: 'COOKING', description: 'Food, recipes, experiments and things learned over time.', subthreads: 12, visual: 'COOKING / VISUAL PENDING' },
  { number: '02', slug: 'sports', title: 'SPORTS', description: 'Training, progress and physical activities.', subthreads: 4, visual: 'SPORTS / VISUAL PENDING' },
  { number: '03', slug: 'martial-arts', title: 'MARTIAL ARTS', description: 'Practice, progress and things learned over time.', subthreads: 5, visual: 'MARTIAL ARTS / VISUAL PENDING' },
  { number: '04', slug: 'travel', title: 'TRAVEL', description: 'Places, routes, observations and stories collected along the way.', subthreads: 8, visual: 'TRAVEL / VISUAL PENDING' },
  { number: '05', slug: 'music', title: 'MUSIC', description: 'Sounds, records, instruments and ideas worth returning to.', subthreads: 6, visual: 'MUSIC / VISUAL PENDING' },
  { number: '06', slug: 'photography', title: 'PHOTOGRAPHY', description: 'Frames, light studies and visual notes from everyday life.', subthreads: 9, visual: 'PHOTOGRAPHY / VISUAL PENDING' },
  { number: '07', slug: 'reading', title: 'READING', description: 'Books, questions and concepts that stay in motion.', subthreads: 7, visual: 'READING / VISUAL PENDING' },
  { number: '08', slug: 'making', title: 'MAKING', description: 'Small builds, experiments and practical things made by hand.', subthreads: 11, visual: 'MAKING / VISUAL PENDING' },
  { number: '09', slug: 'outdoors', title: 'OUTDOORS', description: 'Time outside, changing landscapes and steady exploration.', subthreads: 5, visual: 'OUTDOORS / VISUAL PENDING' },
];

export function getJourneyThread(slug: string) {
  return journeyThreads.find((thread) => thread.slug === slug);
}
