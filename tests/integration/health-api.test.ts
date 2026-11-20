import { expect, test } from 'vitest';
import { GET } from '@/app/api/health/route';

test('health API returns ok', async () => {
  const res = await GET();
  const data = await res.json();
  expect(data.status).toBe('ok');
});
