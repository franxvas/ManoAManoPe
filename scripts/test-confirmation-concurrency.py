"""Prueba exclusivamente el contenedor de pruebas etiquetado manoam=billy."""
import concurrent.futures, subprocess, sys
database=sys.argv[1] if len(sys.argv)>1 else "billy"
if not database.startswith("billy"): raise RuntimeError("Usa una base local de pruebas de Billy")
container='mano-billy-test'
label=subprocess.check_output(['docker','inspect','--format','{{index .Config.Labels "manoam"}}',container],text=True).strip()
if label!='billy': raise RuntimeError('Contenedor de prueba no autorizado')
def worker():
 return subprocess.check_output(['docker','exec',container,'psql','-X','-U','postgres','-d',database,'-At','-v','ON_ERROR_STOP=1','-f','/tests/tests/concurrency-worker.sql'],text=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(lambda _:worker(),range(2)))
lines=[line for result in results for line in result.splitlines() if line in ('true','false')]
assert sorted(lines)==['false','true'], lines
count=subprocess.check_output(['docker','exec',container,'psql','-X','-U','postgres','-d',database,'-Atc',"select count(*) from public.messages where body like 'Servicio confirmado%';"],text=True).strip()
assert count=='1', count
print('Dos validaciones concurrentes: una confirmación, un rechazo y un único evento.')
