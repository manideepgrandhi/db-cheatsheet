# Changelog

## 2026-10-23 (Linux)
- New category 🐧 Linux (AL & RHEL): 23 shell tasks valid on Amazon Linux 2, AL2023 and RHEL 8/9 (files, grep/find, permissions, users/sudo, processes, systemctl/journalctl, disk, memory/CPU, networking, dnf/yum/rpm, tar, cron, ssh/rsync, SELinux, timedatectl, ulimit/lsof, hugepages/THP), with distro differences in the notes.
- Source in `src/data-linux.js`; Linux tasks are shown regardless of the engine filter.

## 2026-10-23
- Theme is now shared with all of Manideep's sites: light / dark / auto-follow-system toggle in the slim shared site bar, stored under `mg-theme`. An existing in-app choice (`dbcs.v1` → `theme`) is migrated once and kept mirrored. The in-app 🌓 button is hidden.
- Shared header bar and footer (inlined copy of `manideepgrandhi.github.io/assets/mg-shared.*`, between `<!--mg:… inline-->` markers in `src/head.html`). Update: run `scripts/sync-mg-shared.py` in the personal repo, then `./build.sh` here.
- No data, storage-key or feature changes.
