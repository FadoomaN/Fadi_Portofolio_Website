-- Remove only the untouched, ownerless examples inserted by the earlier content migration.
-- User-created or edited threads are intentionally excluded.
delete from public.threads
where destination='journey' and created_by is null and created_at=updated_at
and slug in ('cooking','sports','martial-arts','travel','music','photography','reading','making','outdoors')
and title=upper(replace(slug,'-',' '));
;
