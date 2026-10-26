# Changelog

## 2026-10-26 (Locking lab)
- New page `locking.html` (🔒 icon in the header and a "Locking lab" link above the results): an interactive guide to locking in SQL Server and PostgreSQL / Aurora PG, with an SQL Server / PostgreSQL / Compare toggle.
- Clickable compatibility matrices (SQL Server IS/S/U/IX/SIX/X/Sch-S/Sch-M and key-range; PostgreSQL 8 table modes with the commands that take each, and the 4 row-lock modes), plus "statement A vs statement B" pickers.
- Two-session step-through simulator: SQL Server locking RC vs RCSI, SNAPSHOT update conflict (3960), deadlock (1205), lock escalation, UPDLOCK+READPAST queue; PostgreSQL MVCC, ALTER TABLE lock-queue pile-up and lock_timeout, deadlock (40P01), SKIP LOCKED, FK row-lock modes. Each step shows the DMV / pg_locks rows.
- Isolation level tables, an escalation lab (~5,000-lock threshold, LOCK_ESCALATION) and a max_locks_per_transaction calculator, copyable diagnostic queries (kill / cancel / terminate tagged destructive), RDS SQL Server and Aurora PG notes.
- PostgreSQL facts and queries checked against a real PostgreSQL 17 (both matrices, command lock modes, every simulator scenario, all diagnostic queries). T-SQL not yet run against a live SQL Server.

## 2026-10-25 (tempdb)
- New category 🗄️ tempdb (SQL Server), placed after Performance: 27 tasks. Space (per-file size/used/free and startup size, user vs internal vs version store, version store holders, tempdb log and log_reuse_wait_desc, drive free space, autogrowth history), who is using tempdb (session + task space joined to SQL text, temp tables, spilling queries), contention (PAGELATCH on PFS/GAM/SGAM decoded, wait stats, file count vs CPUs and TF 1117/1118 notes, memory-optimized tempdb metadata 2019+), fixes (add / resize / equalise / move / remove files, shrink incl. RDS rds_shrink_tempdbfile, freeing caches, KILL, log-full fix, restart), Amazon RDS specifics (CONTROL on tempdb, no DBCC, instance store, Multi-AZ sync), and monitoring (one-query health summary, Agent alerts for 1105/9002, config checklist).
- Source in `src/data-tempdb.js`. Cards show only the SQL Server panel (new generic `only:'ms'` flag in `app.js`) and are hidden when the engine filter excludes SQL Server.
- T-SQL not yet run against a live SQL Server.

## 2026-10-25 (pglogical)
- New category 🔁 pglogical (Aurora PG), placed after Replication & HA: 28 tasks for pglogical 2.x on Aurora PostgreSQL, one-way and bi-directional. Covers cluster parameter group setup, prerequisite checks, extension and grants, nodes and interfaces, replication sets (row filters, column lists, sequences), create / alter / resync / drop subscription, replicate_ddl_command, bi-directional setup (forward_origins '{}'), conflict resolution, non-overlapping sequences, monitoring (subscription and table sync status, slot lag and retained WAL, pg_stat_replication, workers) and troubleshooting (down subscriptions, orphaned slots, tables without a primary key, Aurora logs, major version upgrades).
- Source in `src/data-pglogical.js`. These cards show only the Aurora PG panel (`pgo` flag) and are hidden when the engine filter excludes Aurora PG.

## 2026-10-24
- Desktop fix: category and engine chips now wrap onto extra rows on wide screens and mouse devices instead of a single row with a hidden scrollbar (which hid Replication & HA … Linux … My snippets on desktop). Phones keep the swipeable single row. Added chip hover and keyboard focus ring.

## 2026-10-23 (Linux)
- New category 🐧 Linux (AL & RHEL): 23 shell tasks valid on Amazon Linux 2, AL2023 and RHEL 8/9 (files, grep/find, permissions, users/sudo, processes, systemctl/journalctl, disk, memory/CPU, networking, dnf/yum/rpm, tar, cron, ssh/rsync, SELinux, timedatectl, ulimit/lsof, hugepages/THP), with distro differences in the notes.
- Source in `src/data-linux.js`; Linux tasks are shown regardless of the engine filter.

## 2026-10-23
- Theme is now shared with all of Manideep's sites: light / dark / auto-follow-system toggle in the slim shared site bar, stored under `mg-theme`. An existing in-app choice (`dbcs.v1` → `theme`) is migrated once and kept mirrored. The in-app 🌓 button is hidden.
- Shared header bar and footer (inlined copy of `manideepgrandhi.github.io/assets/mg-shared.*`, between `<!--mg:… inline-->` markers in `src/head.html`). Update: run `scripts/sync-mg-shared.py` in the personal repo, then `./build.sh` here.
- No data, storage-key or feature changes.
