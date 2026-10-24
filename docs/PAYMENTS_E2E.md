# Payments end-to-end check

Drives every money path (membership, diet plans, store, library, payment links) through the real
route handlers: order → browser verify → webhook → same webhook again (`duplicate`) → refund →
receipt → admin view. Razorpay is a local stand-in; the database is a throwaway local Postgres.
Never point it at production: the script refuses anything but localhost.

```bash
# 1. Throwaway Postgres 16 on port 5433 with the migrations
createdb -h 127.0.0.1 -p 5433 -U postgres rfc_test
psql -h 127.0.0.1 -p 5433 -U postgres -d rfc_test -f scripts/e2e/supabase-stubs.sql
for f in supabase/migrations/*.sql supabase/health-drizzle/*.sql; do
  psql -h 127.0.0.1 -p 5433 -U postgres -d rfc_test -v ON_ERROR_STOP=1 -q -f "$f"
done

# 2. The site, with test-only keys and the fake Razorpay
env -i PATH=$PATH HOME=$HOME POSTGRES_URL=postgresql://postgres@127.0.0.1:5433/rfc_test \
  RAZORPAY_KEY_ID=rzp_test_e2elocal RAZORPAY_KEY_SECRET=e2e_key_secret \
  RAZORPAY_WEBHOOK_SECRET=e2e_webhook_secret RAZORPAY_API_URL=http://127.0.0.1:4010 \
  NEXT_PUBLIC_SITE_URL=http://localhost:3100 npx next dev -p 3100

# 3. The check (starts the fake Razorpay on port 4010 itself)
node scripts/e2e/payments.mjs
```

`env -i` keeps any real keys in your shell out of the run. The same database also runs the
database tests: `TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5433/rfc_test npm test`.
