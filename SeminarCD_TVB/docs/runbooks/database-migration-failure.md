# Database Migration Failure

Plan section 7.3 scenario: Database migration failure.

Use this when a TypeORM migration, Strapi migration, or SQLite-to-PostgreSQL migration fails during deploy or maintenance.

## Immediate Safety

1. Stop the deploy rollout for the affected service.

   ```bash
   kubectl -n <namespace> rollout pause deploy/<service-name>
   ```

2. Confirm whether the migration ran in production, staging, or a local environment.
3. Capture the failing migration name, commit SHA, and exact error.

   ```bash
   kubectl -n <namespace> logs deploy/<service-name> --tail=300
   git rev-parse HEAD
   ```

4. Confirm the latest backup exists before making further changes.

   ```bash
   # Replace with the managed database backup command for the environment.
   pg_dump --schema-only "$DATABASE_URL" > schema-before-recovery.sql
   ```

## Diagnosis

Check for:

- missing environment variables or wrong database name,
- migration already applied in `migrations` table,
- column/table name mismatch caused by a renamed entity,
- data violating a new constraint,
- lock timeout or long-running transaction,
- SQLite source data shape mismatch for migration scripts.

Useful commands:

```bash
kubectl -n <namespace> exec deploy/<service-name> -- npm run migration:run
kubectl -n <namespace> exec deploy/<service-name> -- npm run migration:revert
kubectl -n <namespace> exec deploy/<service-name> -- npm run migrate:sqlite
```

Run only the command that belongs to the affected service.

## Recovery

1. If the migration did not apply any schema changes, fix the script/config and rerun in staging first.
2. If it partially applied changes, use the matching down migration or a reviewed SQL rollback.
3. If data caused the failure, write a deterministic data repair script and test it against a restored copy.
4. Re-apply in staging, then production.

   ```bash
   kubectl -n <namespace> rollout resume deploy/<service-name>
   kubectl -n <namespace> rollout status deploy/<service-name>
   ```

5. Run service tests or smoke checks for the affected workflow.

## Rollback

Rollback application code only after deciding what to do with the database state.

```bash
kubectl -n <namespace> rollout undo deploy/<service-name>
kubectl -n <namespace> rollout status deploy/<service-name>
```

If the schema changed successfully but the app rollback expects the old schema, restore from backup or apply the down migration first.

## Escalation

Escalate if:

- the migration touched Booking or Payment tables,
- no recent database backup is available,
- the down migration is missing or unsafe,
- production writes were accepted while the schema was partially migrated.
