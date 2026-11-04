const { PGlite } = require(
  process.env.MANO_PGLITE_MODULE || '@electric-sql/pglite',
);
const fs = require('fs');
const scriptDirectory = require('path').dirname(require.resolve('./test-mano-db.cjs'));
(async () => {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; create table public.profiles(id uuid primary key,display_name text); insert into profiles values ('11111111-1111-4111-8111-111111111111','Dueño'),('22222222-2222-4222-8222-222222222222','Técnico'),('33333333-3333-4333-8333-333333333333','Otro');`,
  );
  await db.exec(
    `alter table profiles add column rating_average numeric default 0; alter table profiles add column rating_count int default 0; alter table profiles add column created_at timestamptz default now(); create type public.listing_type as enum('product','service','promotion','need'); create table listings(id uuid primary key,type listing_type); create table deals(id uuid primary key,listing_id uuid,seller_id uuid,status text); create table reviews(id uuid,deal_id uuid,reviewed_id uuid,reviewer_id uuid,rating smallint,comment text,created_at timestamptz); create table service_confirmations(deal_id uuid,status text);`,
  );
  await db.exec(
    fs.readFileSync(
      require('path').join(
        scriptDirectory,
        '../supabase/migrations/202611030001_necesito_una_mano.sql',
      ),
      'utf8',
    ),
  );
  await db.exec(
    'grant usage on schema public to anon,authenticated; grant select on public.profiles to anon,authenticated;',
  );
  async function as(id, sql) {
    await db.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','${id}',false)`,
    );
    try {
      return await db.query(sql);
    } finally {
      await db.exec('reset role');
    }
  }
  const owner = '11111111-1111-4111-8111-111111111111',
    worker = '22222222-2222-4222-8222-222222222222',
    other = '33333333-3333-4333-8333-333333333333';
  const created = await as(
    owner,
    `select public.mano_create_request('{"kind":"repair","title":"Reparar moto","approximate_latitude":-5.639483,"approximate_longitude":-78.531283,"repair_item":"Moto","problem_since":"Una semana","transport":"Domicilio","category":"Mecánica","description":"No enciende","approximate_location":"Bagua","photos":[]}'::jsonb,'[{"title":"Revisar moto"}]'::jsonb) as id`,
  );
  const request = created.rows[0].id;
  const area=(await as(owner,`select approximate_latitude,approximate_longitude from mano_requests where id='${request}'`)).rows[0];
  if(Number(area.approximate_latitude)!==-5.64||Number(area.approximate_longitude)!==-78.53)throw Error('Se guardaron coordenadas demasiado precisas');
  const task = (
    await as(owner, `select id from mano_tasks where request_id='${request}'`)
  ).rows[0].id;
  async function fail(id, sql) {
    let failed = false;
    try {
      await as(id, sql);
    } catch {
      failed = true;
    }
    if (!failed) throw Error('Se esperaba un rechazo: ' + sql);
  }
  const sql = `select mano_submit_proposal('${task}','estimate',100,160,'Revisión y reparación','2 días','lunes','Sin repuestos',20,'') as id`;
  await fail(owner, sql);
  const prop = (await as(worker, sql)).rows[0].id;
  if (
    (await as(other, `select * from mano_proposals where id='${prop}'`)).rows
      .length !== 0
  )
    throw Error('Propuesta visible a terceros');
  if (
    (await as(owner, `select * from mano_proposals where id='${prop}'`)).rows
      .length !== 1
  )
    throw Error('Autor no puede ver propuesta');
  await fail(other, `select mano_accept_proposal('${prop}')`);
  await as(owner, `select mano_accept_proposal('${prop}')`);
  await fail(other, sql);
  const rev = (
    await as(
      worker,
      `select mano_revise_quote('${prop}',180,null,'Repuesto y mano de obra') as id`,
    )
  ).rows[0].id;
  if (
    (
      await as(
        worker,
        `select amount_min from mano_proposals where id='${prop}'`,
      )
    ).rows[0].amount_min !== '100'
  )
    throw Error('Precio cambió antes de aceptación');
  await fail(other, `select mano_respond_revision('${rev}',true)`);
  await as(owner, `select mano_respond_revision('${rev}',true)`);
  if (
    Number(
      (
        await as(
          worker,
          `select amount_min from mano_proposals where id='${prop}'`,
        )
      ).rows[0].amount_min,
    ) !== 180
  )
    throw Error('Precio no se actualizó');
  await as(
    worker,
    `select mano_change_task_status('${task}','request_completion')`,
  );
  await fail(
    worker,
    `select mano_change_task_status('${task}','confirm_completion')`,
  );
  await as(
    owner,
    `select mano_change_task_status('${task}','confirm_completion')`,
  );
  await as(owner, `select mano_submit_review('${task}',5,'Buen trabajo')`);
  const project = (
    await as(
      owner,
      `select mano_create_request('{"kind":"project","title":"Feria local","category":"Eventos","description":"Organizar feria","approximate_location":"Bagua","photos":[]}'::jsonb,'[{"title":"Foto"},{"title":"Sonido"}]'::jsonb) as id`,
    )
  ).rows[0].id;
  const projectTasks = (
    await as(
      owner,
      `select id from mano_tasks where request_id='${project}' order by title`,
    )
  ).rows;
  const p2 = (
    await as(
      worker,
      `select mano_submit_proposal('${projectTasks[0].id}','fixed',200,null,'Fotografía','1 día','lunes','Incluidos',null,'') as id`,
    )
  ).rows[0].id;
  await as(owner, `select mano_accept_proposal('${p2}')`);
  await as(
    worker,
    `select mano_change_task_status('${projectTasks[0].id}','request_completion')`,
  );
  await as(
    owner,
    `select mano_change_task_status('${projectTasks[0].id}','confirm_completion')`,
  );
  const states = (
    await as(
      owner,
      `select status from mano_tasks where request_id='${project}'`,
    )
  ).rows.map((x) => x.status);
  if (!states.includes('completed') || !states.includes('open'))
    throw Error('Una tarea cerró el proyecto completo');
  await fail(
    other,
    `insert into mano_messages(proposal_id,sender_id,body) values('${p2}','${other}','Hola')`,
  );
  if (
    Number(
      (await db.query(`select rating_count from profiles where id='${worker}'`))
        .rows[0].rating_count,
    ) !== 1
  )
    throw Error('Reseña no actualizó perfil');
  if ((await as(other, 'select * from mano_list_threads()')).rows.length !== 0)
    throw Error('Bandeja filtra conversaciones ajenas');
  if ((await as(owner, 'select * from mano_list_threads()')).rows.length < 2)
    throw Error('Solicitudes ausentes de bandeja');
  if (
    (await db.query(`select * from list_public_reviews('${worker}',null)`)).rows
      .length !== 1
  )
    throw Error('Reseña ausente del perfil');
  console.log(
    'PASS: migración, privacidad, aceptación, revisión de precio, mensajes y tareas independientes',
  );
  await db.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
