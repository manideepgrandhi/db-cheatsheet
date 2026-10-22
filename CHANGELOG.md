# Changelog

## 2026-10-23
- Theme is now shared with all of Manideep's sites: light / dark / auto-follow-system toggle in the slim shared site bar, stored under `mg-theme`. An existing in-app choice (`dbcs.v1` → `theme`) is migrated once and kept mirrored. The in-app 🌓 button is hidden.
- Shared header bar and footer (inlined copy of `manideepgrandhi.github.io/assets/mg-shared.*`, between `<!--mg:… inline-->` markers in `src/head.html`). Update: run `scripts/sync-mg-shared.py` in the personal repo, then `./build.sh` here.
- No data, storage-key or feature changes.
