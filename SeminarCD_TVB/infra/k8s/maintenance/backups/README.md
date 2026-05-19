# Backup and Restore Jobs

Phase 7 M6 defines Kubernetes maintenance jobs for the database maintenance goals in plan section 7.4:

- daily PostgreSQL `pg_dump` exports for service databases
- weekly ChromaDB vector collection snapshots
- suspended restore jobs that operators patch and unsuspend during recovery

## Secrets

Create `backup-target-secret` in the `maintenance` namespace before applying the jobs. Use `backup-secrets.example.yaml` as the field reference and source real values from the environment secret manager.

Required keys:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DEFAULT_REGION`
- `S3_BUCKET`
- `PGHOST`
- `PGUSER`
- `PGPASSWORD`

The PostgreSQL jobs use one backup user that can read and restore the service databases listed in `backup-config.yaml`. Application services still keep their own database users.

## Apply

```bash
kubectl apply -k infra/k8s/maintenance/backups
```

## Schedules

| Job | Schedule | Purpose |
|---|---|---|
| `postgres-backup` | `15 2 * * *` | Daily custom-format dumps for service PostgreSQL databases |
| `chromadb-backup` | `30 3 * * 0` | Weekly JSONL export of ChromaDB collections |

Configure S3 lifecycle retention for `BACKUP_RETENTION_DAYS=30`; the jobs write date-stamped prefixes but do not delete S3 objects themselves.

## Restore PostgreSQL

1. Patch the restore prefix to an existing backup folder.

   ```bash
   kubectl -n maintenance patch job postgres-restore --type=json \
     -p='[{"op":"replace","path":"/spec/template/spec/initContainers/0/env/0/value","value":"travel-tvb/postgres/<backup-id>"}]'
   ```

2. Unsuspend the job.

   ```bash
   kubectl -n maintenance patch job postgres-restore --type=merge -p='{"spec":{"suspend":false}}'
   kubectl -n maintenance logs job/postgres-restore -f
   ```

3. Restart affected services after restore.

## Restore ChromaDB

1. Patch the Chroma restore prefix.

   ```bash
   kubectl -n maintenance patch job chromadb-restore --type=json \
     -p='[{"op":"replace","path":"/spec/template/spec/containers/0/env/0/value","value":"travel-tvb/chromadb/<backup-id>"}]'
   ```

2. Set `CHROMA_RESTORE_CLEAR=true` only when replacing an existing collection is intended.
3. Unsuspend the restore job.

   ```bash
   kubectl -n maintenance patch job chromadb-restore --type=merge -p='{"spec":{"suspend":false}}'
   kubectl -n maintenance logs job/chromadb-restore -f
   ```

4. Restart AI Chatbot pods if collection metadata or embeddings changed materially.

## Verification

```bash
kubectl -n maintenance get cronjob,job,pod
kubectl -n maintenance logs cronjob/postgres-backup --tail=100
kubectl -n maintenance logs cronjob/chromadb-backup --tail=100
```

Prometheus/Grafana should monitor failed Jobs in M7 hardening or when kube-state-metrics is introduced.
