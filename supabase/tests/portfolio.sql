\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data) values('a0000000-0000-4000-8000-000000000001','uno@example.test','{"display_name":"Portafolio uno"}'),('a0000000-0000-4000-8000-000000000002','dos@example.test','{"display_name":"Portafolio dos"}');
insert into storage.objects(bucket_id,name) values('portfolio-media','a0000000-0000-4000-8000-000000000001/b0000000-0000-4000-8000-000000000001/work.jpg');
create function public.test_assert(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FALLO: %',label; end if; end $$;
create function public.test_denied(statement text) returns void language plpgsql as $$ declare denied boolean:=false; begin begin execute statement; exception when others then denied:=true; end; if not denied then raise exception 'Acción prohibida permitida: %',statement; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select public.save_portfolio_work('b0000000-0000-4000-8000-000000000001','Mesa hecha a mano','Carpintería','Trabajo de prueba hecho a mano con madera','2026-01-01',false,null,'[{"path":"a0000000-0000-4000-8000-000000000001/b0000000-0000-4000-8000-000000000001/work.jpg","kind":"work"}]');
select public.test_assert((select count(*)=1 from public.portfolio_works),'propietario consulta oculto');
select public.test_assert(not public.portfolio_work_confirmed('b0000000-0000-4000-8000-000000000001'),'manual no se confirma');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
select public.test_assert((select count(*)=0 from public.portfolio_works),'ajeno no consulta oculto');
select public.test_denied($q$select public.delete_portfolio_work('b0000000-0000-4000-8000-000000000001')$q$);
select public.test_denied($q$select public.save_portfolio_work('b0000000-0000-4000-8000-000000000001','Mesa ajena','Muebles','Descripción de intento de modificación','2026-01-01',true,null,'[]')$q$);
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select public.test_denied($q$select public.save_portfolio_work('b0000000-0000-4000-8000-000000000001','Mesa propia','Muebles','Descripción que no debe confirmarse sola','2026-01-01',true,'e0000000-0000-4000-8000-000000000001','[]')$q$);
select public.save_portfolio_work('b0000000-0000-4000-8000-000000000001','Mesa hecha a mano','Carpintería','Trabajo de prueba hecho a mano con madera','2026-01-01',true,null,'[{"path":"a0000000-0000-4000-8000-000000000001/b0000000-0000-4000-8000-000000000001/work.jpg","kind":"after"}]');
select set_config('request.jwt.claim.sub','',true);
set local role anon;
select public.test_assert((select count(*)=1 from public.portfolio_works),'público consulta visible');
select public.test_denied($q$select public.delete_portfolio_work('b0000000-0000-4000-8000-000000000001')$q$);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select public.test_assert(cardinality(public.delete_portfolio_work('b0000000-0000-4000-8000-000000000001'))=1,'eliminar devuelve objetos a limpiar');
select public.test_assert((select count(*)=0 from public.portfolio_media),'no quedan referencias de fotos');
rollback;
\echo 'Portafolio: autoría, visibilidad, confirmación y eliminación correctas'
