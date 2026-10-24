# Changelog

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
