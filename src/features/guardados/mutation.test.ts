import { QueryClient } from '@tanstack/react-query';
import { setSaved } from './api';
import { savedQueryKey, toggleSavedInCache } from './mutation';
jest.mock('./api', () => ({ setSaved: jest.fn() }));
const save = jest.mocked(setSaved);
let cache: QueryClient;
beforeEach(() => { cache = new QueryClient({ defaultOptions: { queries: { retry: false } } }); save.mockReset(); });
afterEach(() => cache.clear());
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function settleOptimisticUpdates() { await Promise.resolve(); await Promise.resolve(); }
test('tarjeta y detalle comparten la misma lista y solo envían una operación por doble toque', async () => {
  const pending = deferred(); save.mockReturnValue(pending.promise);
  const first = toggleSavedInCache(cache, 'listing', 'user', 'one');
  await settleOptimisticUpdates();
  await toggleSavedInCache(cache, 'listing', 'user', 'one');
  expect(cache.getQueryData(savedQueryKey('listing', 'user'))).toEqual(['one']);
  expect(save).toHaveBeenCalledTimes(1);
  pending.resolve(); await first;
});
test('el fallo de un guardado no borra otro cambio simultáneo', async () => {
  const first = deferred(), second = deferred();
  save.mockImplementation((_type, id) => id === 'one' ? first.promise : second.promise);
  const a = toggleSavedInCache(cache, 'listing', 'user', 'one').catch((error) => error);
  const b = toggleSavedInCache(cache, 'listing', 'user', 'two');
  await settleOptimisticUpdates();
  second.resolve(); await b;
  first.reject(new Error('Sin conexión')); await a;
  expect(cache.getQueryData(savedQueryKey('listing', 'user'))).toEqual(['two']);
});
test('una consulta pendiente no reemplaza el cambio optimista', async () => {
  const response = deferred();
  const query = cache.fetchQuery({ queryKey: savedQueryKey('event', 'user'), queryFn: async () => { await response.promise; return ['old']; } }).catch(() => undefined);
  save.mockResolvedValue(undefined);
  await toggleSavedInCache(cache, 'event', 'user', 'new');
  response.resolve(); await query;
  expect(cache.getQueryData(savedQueryKey('event', 'user'))).toEqual(['new']);
});
test('usuarios y tipos diferentes no comparten favoritos', async () => {
  save.mockResolvedValue(undefined);
  await toggleSavedInCache(cache, 'listing', 'one-user', 'same-id');
  await toggleSavedInCache(cache, 'event', 'another-user', 'same-id');
  expect(cache.getQueryData(savedQueryKey('listing', 'another-user'))).toBeUndefined();
  expect(cache.getQueryData(savedQueryKey('event', 'one-user'))).toBeUndefined();
});
