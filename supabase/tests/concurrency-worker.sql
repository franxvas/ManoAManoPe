\set ON_ERROR_STOP on
select value as secret from public.billy_test_code \gset
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
select public.validate_service_code('d0000000-0000-4000-8000-000000000001',:'secret')->>'ok';
commit;
