# Browser workflow verification

Verified against the static Site preview on 1 November 2026. All sample flows were synthetic and were used only to verify software behavior.

- Ran the full 900-record training workflow. All seven execution stages completed; the forest, preprocessing, source records and test results were saved to IndexedDB.
- Reloaded the page. The experiment remained in history. Restored it without retraining; test predictions and model explanations were recomputed.
- Scored a 30-record unlabelled synthetic sample. Saved all 30 outputs and atomically created 11 flagged review cases.
- Attempted to close a case with no verdict/notes. The form rejected the incomplete decision and retained the draft.
- Saved an Inconclusive review with notes and evidence reference. Reloaded and verified that status, notes, revision and history remained.
- Exported and parsed the saved case. It contained two audit events and all eight local sensitivity factors.
- Exported a full model bundle, imported it through the file chooser, and verified the restored model and evaluation. The imported source is explicitly marked unverified.
- Uploaded a CSV lacking a required feature. Schema validation rejected it and displayed the missing column.
- Uploaded 25 unlabelled synthetic QA records with a missing value, an unseen category and an out-of-range value. Scored all records, saved five review flags, exported the CSV and verified all output rows, flags and quality warnings.

No production traffic, real incident labels, multi-user backend, live packet capture or background scheduling was asserted or tested.

## Website audit — 2026-11-01

Verified a 122-record upload, duplicate removal to 120, completed training, displayed-ID search, 24-row unlabelled batch (12 flagged; six warning rows), review closure and filter consistency, feedback CSV, model export/import, invalid model rejection, refresh persistence and restore. Cancelled a running 9,500-record job and confirmed no incomplete experiment was saved. At a 375px iframe viewport, verified mobile menu/dataset navigation and eliminated header horizontal overflow (content width equals viewport). Temporary iframe harness removed before packaging.

Fixed formatted FL/B ID matching, review detail selection under filters, rejection of stale custom prediction replies, batch-input mutation during scoring, stale batch state on new training, malformed CSV quote rejection and the no-trailing-newline 10,000-record boundary. Added `tests/website-state.test.cjs` covering these data/state regressions. Both this suite and `tests/workflows.test.cjs` pass. Model engine unchanged; prior independent XAI numerical checks still apply. Synthetic QA data is not evidence of operational intrusion-detection performance.
