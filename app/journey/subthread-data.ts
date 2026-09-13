export type JourneySubthread = {
  slug: string;
  title: string;
  description: string;
  logs: number;
  visual: string;
};

export const cookingSubthreads: JourneySubthread[] = [
  { slug: 'ramen', title: 'RAMEN', description: 'Different ramen attempts, broths, noodles and improvements.', logs: 4, visual: 'RAMEN / VISUAL PENDING' },
  { slug: 'pasta', title: 'PASTA', description: 'Recipes, textures and techniques explored over time.', logs: 6, visual: 'PASTA / VISUAL PENDING' },
  { slug: 'churros', title: 'CHURROS', description: 'Crisp dough, cinnamon sugar and repeatable results.', logs: 3, visual: 'CHURROS / VISUAL PENDING' },
  { slug: 'chicken-dishes', title: 'CHICKEN DISHES', description: 'Weeknight recipes, marinades and better preparation.', logs: 5, visual: 'CHICKEN DISHES / VISUAL PENDING' },
  { slug: 'baking', title: 'BAKING', description: 'Doughs, oven experiments and lessons from each batch.', logs: 8, visual: 'BAKING / VISUAL PENDING' },
  { slug: 'desserts', title: 'DESSERTS', description: 'Sweet recipes, finishing touches and new combinations.', logs: 4, visual: 'DESSERTS / VISUAL PENDING' },
];
