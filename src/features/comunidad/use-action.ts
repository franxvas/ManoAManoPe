import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useState } from 'react';

// Ejecuta una acción del servidor, muestra el error y refresca las consultas afectadas.
export function useCommunityAction(keys: QueryKey[]) {
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action: () => Promise<unknown>) {
    if (busy) return false;
    setBusy(true);
    setError('');
    try {
      await action();
      await Promise.all(keys.map((queryKey) => cache.invalidateQueries({ queryKey })));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal, inténtalo otra vez.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, setError, run };
}
