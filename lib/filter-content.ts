export function filterContent<T>(items: readonly T[], query: string, fields: (item: T) => readonly (string | null | undefined)[]): T[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [...items];
  return items.filter(item => {
    const searchable = fields(item).map(value => (value ?? '').toLocaleLowerCase());
    return terms.every(term => searchable.some(value => value.includes(term)));
  });
}
