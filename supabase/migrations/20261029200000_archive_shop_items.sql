-- Archive instead of delete for the shop too (second admin audit, finding A3). Additive in effect:
-- the kind check on archived_records is widened so removed products, categories, combos and blog
-- posts are kept there instead of being erased. No rows change.
alter table public.archived_records drop constraint if exists archived_records_kind_check;
alter table public.archived_records add constraint archived_records_kind_check
  check (kind in ('member', 'lead', 'shop-product', 'shop-category', 'shop-combo', 'shop-post'));
