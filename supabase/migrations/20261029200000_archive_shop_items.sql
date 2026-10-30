-- Archive instead of delete for the shop and Diet Pro too (second admin audit, findings A3 and A3b,
-- owner chose archive on 30 Oct). Additive in effect: the kind check on archived_records is widened
-- so removed products, categories, combos, blog posts and Diet Pro clients are kept there instead
-- of being erased. No rows change.
alter table public.archived_records drop constraint if exists archived_records_kind_check;
alter table public.archived_records add constraint archived_records_kind_check
  check (kind in ('member', 'lead', 'shop-product', 'shop-category', 'shop-combo', 'shop-post', 'diet-client'));
