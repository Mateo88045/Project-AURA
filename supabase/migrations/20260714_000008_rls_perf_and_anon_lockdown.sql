-- RLS performance + anon lockdown from the 2026-07-14 full database review.
-- Applied to the live project on 2026-07-14 (migration name: rls_perf_and_anon_lockdown).
--
-- 1. Rewrite every self-* policy to use (select auth.uid()) so Postgres
--    evaluates it once per query instead of once per row (advisor lint 0003).
-- 2. The mobile app never touches these tables before sign-in — revoke all
--    table privileges from anon so the schema isn't discoverable through
--    GraphQL with just the publishable key (advisor lint 0026).
--    (public.waitlist keeps its anon INSERT grant — that's the landing page.)
--
-- Note: the column-level UPDATE grant on public.users (migration 000007)
-- is unaffected by the policy rewrite — grants and policies are independent.

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'connections', 'fixed_events', 'tasks',
    'scheduled_blocks', 'task_completions', 'guardrails', 'conversations'
  ]
  loop
    execute format($f$
      drop policy if exists "%1$s_self_select" on public.%1$s;
      drop policy if exists "%1$s_self_insert" on public.%1$s;
      drop policy if exists "%1$s_self_update" on public.%1$s;
      drop policy if exists "%1$s_self_delete" on public.%1$s;
    $f$, t);

    if t = 'users' then
      execute format($f$
        create policy "%1$s_self_select" on public.%1$s for select using ((select auth.uid()) = id);
        create policy "%1$s_self_update" on public.%1$s for update using ((select auth.uid()) = id);
      $f$, t);
    else
      execute format($f$
        create policy "%1$s_self_select" on public.%1$s for select using ((select auth.uid()) = user_id);
        create policy "%1$s_self_insert" on public.%1$s for insert with check ((select auth.uid()) = user_id);
        create policy "%1$s_self_update" on public.%1$s for update using ((select auth.uid()) = user_id);
        create policy "%1$s_self_delete" on public.%1$s for delete using ((select auth.uid()) = user_id);
      $f$, t);
    end if;

    execute format('revoke all on public.%1$s from anon;', t);
  end loop;
end $$;
