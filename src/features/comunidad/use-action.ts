import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { errorMessage } from '@/utils/errors';
import { confirmAction, type ConfirmOptions } from './confirm';

// Ejecuta una acción del servidor, muestra el error o un aviso de éxito y refresca las consultas afectadas.
export function useCommunityAction(keys: QueryKey[]) {
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function run(action: () => Promise<unknown>, options: { confirm?: ConfirmOptions; success?: string } = {}) {
    if (busy) return false;
    if (options.confirm && !(await confirmAction(options.confirm))) return false;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await Promise.all(keys.map((queryKey) => cache.invalidateQueries({ queryKey })));
      // Mi actividad muestra solicitudes, inscripciones y publicaciones: se refresca siempre.
      await cache.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith('my-') });
      if (options.success) setNotice(options.success);
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, notice, setError, run };
}
