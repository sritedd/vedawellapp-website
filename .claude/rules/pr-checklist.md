# PR checklist — the five lines that catch the "done but not done" class

Three items the record called done were not — a suite that tested NSW eight
times, a cron that was never scheduled, a map of dead links — and all three
passed type-checks and code review (guide/19 §6.3). Before any change ships:

1. **Assert the discriminator, not the label.** A test fixture must set the
   column the app branches on. `projects.state` defaulted to `'NSW'` and the
   "8-state" suite reported green while every state-dependent branch ran as NSW.
2. **A cron route needs a schedule.** Anything under `src/app/api/cron/` ships
   with a matching `netlify/functions/cron-*.mts`, or it is dead code that
   type-checks. `storage-sweep` sat unscheduled for two weeks.
3. **A new government link runs the checker; a new legal figure carries a source
   and a date.** `node scripts/check-gov-links.mjs`; every entry in
   `STATE_INSURANCE`, `STATE_COOLING_OFF` and the licence map has `lastVerified`
   and `source`. Government sites restructure every couple of years.
4. **Test helpers throw.** A helper that returns `false` on failure produces a
   failure report that blames the wrong thing — 13 call sites discarded
   `goToTab()`'s boolean and reported "element not visible" for a navigation that
   never happened.
5. **Verify on prod, not the type checker.** Every P0 in this codebase passed
   `tsc`. Drive the real site, read the artifact (the snapshot, not the error
   text), and force the failing code path before calling it fixed.
