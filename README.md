# FlowLens

An educational website implementing the attached Explainable AI for Network Intrusion Detection report's workflow.

## Run
Serve `dist` with any static HTTP server. No dependencies or build step are required. Web Workers require HTTP(S), so do not open `index.html` directly as a file. The hosted Site is configured by `.openai/hosting.json`.

## Features
- Seeded, explicitly synthetic 900-record demonstration CSV.
- CSV upload and drag/drop; raw preview; target and label mapping; feature exclusion.
- Real browser-local Random Forest training in a Web Worker: 150 trees, balanced training class weights, seed 42, 75/25 stratified split, maximum depth 12 and minimum leaf size 2.
- Training-only median/mode imputation, constant removal, one-hot encoding and handling of unknown categories. Blank and NaN/Infinity cells are treated as missing.
- Held-out accuracy, Suspicious precision/recall/F1, macro-F1 and confusion matrix.
- Original-feature permutation importance, 3 repeats, using test macro-F1.
- Per-flow sensitivity from replacing each feature with its training median/mode.
- Search, prediction/error filtering, pagination, custom-flow prediction, JSON experiment/flow exports and CSV download.

## Fidelity and limits
The report describes Python/scikit-learn/Streamlit. This is an independent JavaScript implementation so the website runs without a server. Trees use up to 10 quantile split candidates at each node. Scores will differ from scikit-learn and the report's 89.33% preliminary synthetic result. No trained model or source dataset was included with the report; the bundled dataset is newly generated synthetic data, not that original dataset.

All experiments are computed from the selected data. Probabilities are uncalibrated model outputs. Explanations are perturbation measures, not causal effects or SHAP values. No live capture, prevention, identification of attack families or real-world benchmark claims are implemented. Experiments, source datasets, fitted models, batch predictions, review cases and audit events persist in browser IndexedDB. Refreshing clears the active in-memory model but saved experiments can be restored without retraining; test metrics and permutation importance are recomputed on restore. Clearing browser site data removes saved workflows. External font loading uses a system-font fallback.

CSV limits: 5 MB, 20–10,000 records, 80 raw columns, 1–40 selected features, 30 categories per training feature and 160 encoded dimensions. Both target classes need at least 4 records. Review identifiers, duplicate/related flows, label meaning and leakage before making performance claims. Group/time-based validation and public-dataset benchmarking are future work.


## Connected workflows

1. **Train and save**: validate records and label mapping, optionally remove duplicate selected-feature/label rows, stratify the split, fit preprocessing, train 150 trees, evaluate, calculate explanations, and atomically save the model and experiment. The UI records actual execution stages; failures/cancellation do not show completion.
2. **Score and route**: upload an unlabelled CSV matching the fitted feature schema, validate numeric types, run inference without fitting, apply an independent review-routing threshold, save all per-row outputs, and optionally create cases in the same transaction. Unknown categories, imputation and out-of-range values are recorded per row. Routing does not change the 0.50 class threshold or held-out metrics.
3. **Investigate and document**: queue Suspicious test predictions or flagged batch rows, inspect original values and local sensitivity using the originating saved model, record status/verdict/analyst/notes/evidence references, and export the saved case with its audit history. Closing requires a verdict and notes; confirming suspicious activity also requires an evidence reference. These are manually entered analyst judgments, not independently verified incident claims.
4. **Resume and transfer**: restore a saved forest without training again, export/import a validated JSON model bundle containing source data/model/evaluation, and reopen saved batch outputs. Imported model/data provenance is explicitly unverified. Invalid tree structures, dimensions and inconsistent partitions are rejected.
5. **Feedback**: export closed conclusive analyst decisions for the selected case's experiment as CSV, with `analyst_label` as target. It is never automatically used to retrain or replace dataset labels. Review before reuse; labelled feedback is not a new held-out evaluation.

Persistence is local to one browser/device, not a shared multi-user backend or a background monitoring service. No scheduled jobs, packet capture, automatic blocking, real benchmark data, external messaging or third-party integrations are implied.

Run meaningful logic checks with `node tests/workflows.test.cjs`. Browser QA covers IndexedDB write/read across refresh, restoring a saved model, batch scoring and routing, saving/retaining a case decision, model bundle round-trip and exported records.
