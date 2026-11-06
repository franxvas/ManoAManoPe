import { savedRoute } from './navigation';
test('abre la solicitud concreta y no solamente la lista', () => {
  expect(savedRoute({ type: 'mano', id: 'request' })).toEqual({ pathname: '/mano', params: { requestId: 'request' } });
});
test('un alquiler guardado no se abre como préstamo', () => {
  expect(savedRoute({ type: 'resource', id: 'rental', resourceKind: 'rental' })).toEqual({ pathname: '/alquileres', params: { postId: 'rental' } });
  expect(savedRoute({ type: 'resource', id: 'loan', resourceKind: 'loan' })).toEqual({ pathname: '/prestamos', params: { postId: 'loan' } });
});
