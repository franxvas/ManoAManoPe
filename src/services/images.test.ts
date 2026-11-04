import { readImage } from './images';
describe('fotografías sin extensión en la URL',()=>{
 const original=globalThis.fetch;
 afterEach(()=>{globalThis.fetch=original;});
 it('reconoce PNG en un blob en lugar de inventar un Content-Type',async()=>{
  globalThis.fetch=jest.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new Uint8Array([137,80,78,71,13,10,26,10]).buffer});
  const result=await readImage('blob:http://localhost/una-foto');expect(result.contentType).toBe('image/png');expect(result.extension).toBe('png');
 });
 it('rechaza archivos que no son fotos',async()=>{
  globalThis.fetch=jest.fn().mockResolvedValue({ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer});
  await expect(readImage('blob:archivo')).rejects.toThrow();
 });
});
