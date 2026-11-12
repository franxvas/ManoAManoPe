import { provinceOptions } from './peru-provinces';

describe('provincias', () => {
  it('incluye Bagua aunque su fila venga con código 00', () => {
    const rows = [
      { departamento: '01', provincia: '00', distrito: '00', nombre: 'Amazonas' },
      { departamento: '01', provincia: '00', distrito: '00', nombre: 'Bagua' },
      { departamento: '01', provincia: '01', distrito: '00', nombre: 'Chachapoyas' },
      { departamento: '01', provincia: '01', distrito: '01', nombre: 'Chachapoyas' },
      { departamento: '01', provincia: '02', distrito: '01', nombre: 'Bagua' },
    ];
    expect(provinceOptions(rows, '01')).toEqual([
      { value: '01', label: 'Chachapoyas' },
      { value: '02', label: 'Bagua' },
    ]);
  });
});
