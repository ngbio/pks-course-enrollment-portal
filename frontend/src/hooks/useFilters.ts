import { useSearchParams } from 'react-router-dom';

export function useFilters() {
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get('page') ?? 1);
  const page =
    Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= 1000000
      ? rawPage
      : 1;
  const search = (params.get('search') ?? '').slice(0, 100);
  const category = (params.get('category') ?? '').slice(0, 100);
  function update(values: Record<string, string | number>) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(values)) {
        if (value && value !== 1) next.set(key, String(value));
        else next.delete(key);
      }
      return next;
    });
  }
  const query = new URLSearchParams({
    page: String(page),
    limit: '12',
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
  }).toString();
  return { page, search, category, query, update };
}
