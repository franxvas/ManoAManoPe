\set ON_ERROR_STOP on
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('a0000000-0000-4000-8000-000000000001','cliente@example.test','{"display_name":"Cliente de prueba"}'),
 ('a0000000-0000-4000-8000-000000000002','trabajador@example.test','{"display_name":"Trabajador de prueba"}'),
 ('a0000000-0000-4000-8000-000000000003','ajeno@example.test','{"display_name":"Ajeno de prueba"}');
insert into public.categories(id,name,slug,type) values('b0000000-0000-4000-8000-000000000001','Servicio de prueba','servicio-prueba','service');
insert into public.listings(id,owner_id,category_id,type,title,description,price,city,region,latitude,longitude,status) values('c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','service','Servicio de prueba','Servicio exclusivamente para pruebas',100,'Bagua','Amazonas',-5.64,-78.53,'published');
insert into public.conversations(id,listing_id,buyer_id,seller_id,status) values('d0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','accepted');
insert into public.offers(id,conversation_id,listing_id,sender_id,receiver_id,amount,status) values('e0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001',100,'accepted');
insert into public.deals(id,conversation_id,listing_id,accepted_offer_id,buyer_id,seller_id,agreed_amount) values('f0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002',100);
create function public.test_assert(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FALLO: %',label; end if; end $$;
create function public.test_denied(statement text) returns void language plpgsql as $$ declare denied boolean:=false; begin begin execute statement; exception when others then denied:=true; end; if not denied then raise exception 'Se permitió una acción prohibida: %',statement; end if; end $$;
grant usage on schema public to authenticated;
grant select on public.profiles,public.reviews,public.deals to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000003',true);
select public.test_denied($q$select public.get_service_confirmation('d0000000-0000-4000-8000-000000000001')$q$);
select public.test_denied($q$select * from public.service_confirmations$q$);
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select public.test_denied($q$select public.request_service_completion('d0000000-0000-4000-8000-000000000001')$q$);
select public.test_denied($q$select public.complete_deal_and_review('d0000000-0000-4000-8000-000000000001',5::smallint,'Prueba')$q$);
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
select public.request_service_completion('d0000000-0000-4000-8000-000000000001');
select public.test_denied($q$select public.issue_service_code('d0000000-0000-4000-8000-000000000001')$q$);
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select public.issue_service_code('d0000000-0000-4000-8000-000000000001')->>'code' as oldcode \gset
select public.test_denied($q$select public.validate_service_code('d0000000-0000-4000-8000-000000000001','123456')$q$);
select public.test_denied($q$select public.issue_service_code('d0000000-0000-4000-8000-000000000001')$q$);
reset role;
update public.service_confirmations set issued_at=now()-interval '1 minute';
set local role authenticated;
select public.issue_service_code('d0000000-0000-4000-8000-000000000001')->>'code' as newcode \gset
select public.test_assert(:'oldcode'<>:'newcode','regenerar invalida el anterior');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
select public.test_assert((public.validate_service_code('d0000000-0000-4000-8000-000000000001',:'oldcode')->>'ok')::boolean=false,'rechaza código anterior');
select public.test_denied(format('select public.validate_service_code(%L,%L)','d0000000-0000-4000-8000-000000000099',:'newcode'));
select public.validate_service_code('d0000000-0000-4000-8000-000000000001','invalido') from generate_series(1,4);
select public.test_assert(public.get_service_confirmation('d0000000-0000-4000-8000-000000000001')->>'status'='locked','cinco errores bloquean');
reset role;
update public.service_confirmations set issued_at=now()-interval '1 minute';
set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select public.issue_service_code('d0000000-0000-4000-8000-000000000001')->>'code' as finalcode \gset
reset role;
update public.service_confirmations set expires_at=now()-interval '1 second';
set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
select public.test_assert(public.validate_service_code('d0000000-0000-4000-8000-000000000001',:'finalcode')->>'reason'='expired','rechaza vencido');
reset role;
update public.service_confirmations set expires_at=now()+interval '1 minute';
set local role authenticated;
select public.test_assert((public.validate_service_code('d0000000-0000-4000-8000-000000000001',:'finalcode')->>'ok')::boolean,'código correcto completa el servicio');
select public.test_assert(public.validate_service_code('d0000000-0000-4000-8000-000000000001',:'finalcode')->>'reason'='already_finished','uso único');
select public.test_assert(public.get_service_confirmation('d0000000-0000-4000-8000-000000000001')->>'deal_status'='completed','transición consistente');
reset role;
select public.test_assert((select count(*)=1 from public.messages where body like 'Servicio confirmado%'),'un solo evento');

set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
select public.complete_deal_and_review('d0000000-0000-4000-8000-000000000001',4::smallint,'Buen trabajo de prueba');
select public.test_denied($q$select public.complete_deal_and_review('d0000000-0000-4000-8000-000000000001',5::smallint,'Duplicada')$q$);
select public.test_denied($q$update public.profiles set rating_average=5,rating_count=100 where id=auth.uid()$q$);
select public.test_denied($q$update public.profiles set verified=true where id=auth.uid()$q$);
select public.test_denied($q$insert into public.reviews(deal_id,reviewer_id,reviewed_id,rating) values('f0000000-0000-4000-8000-000000000001',auth.uid(),auth.uid(),5)$q$);
select public.test_assert((public.get_review_context('d0000000-0000-4000-8000-000000000001')->>'reviewed')::boolean,'contexto marca reseña registrada');
select public.test_assert((select rating_average=4 and rating_count=1 from public.profiles where id='a0000000-0000-4000-8000-000000000002'),'promedio desde reseña real');
select public.test_assert((select count(*)=1 from public.list_public_reviews('a0000000-0000-4000-8000-000000000002',null)),'contexto público sin datos del acuerdo');
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000003',true);
select public.test_denied($q$select public.complete_deal_and_review('d0000000-0000-4000-8000-000000000001',5::smallint,'Ajeno')$q$);
select public.test_denied($q$select public.get_review_context('d0000000-0000-4000-8000-000000000001')$q$);
reset role;
select public.test_assert((public.get_profile_trust('a0000000-0000-4000-8000-000000000002')->>'confirmed_services')::integer=1,'servicios desde confirmaciones reales');
select public.test_assert((public.get_profile_trust('a0000000-0000-4000-8000-000000000002')->>'review_average')::numeric=4,'promedio real');
select public.test_assert(not(public.get_profile_trust('a0000000-0000-4000-8000-000000000002')?'returned_loans'),'no inventa préstamos');
select public.test_assert((public.get_profile_trust('a0000000-0000-4000-8000-000000000003')->>'review_count')::integer=0,'usuario nuevo sin reputación ficticia');
rollback;
\echo 'Reseñas: operación completada, duplicación, autoría y agregados correctos'
