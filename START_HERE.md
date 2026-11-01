# FlowLens complete project

## Run the website
1. Extract this ZIP.
2. Open a terminal in the FlowLens folder.
3. Run: python3 -m http.server 8000 --directory dist
4. Open http://localhost:8000 in your browser.

On Windows, use py instead of python3 if needed. No dependency installation or build is required. Use HTTP: opening index.html directly does not support the worker workflow.

## Run the automated tests
Install Node.js, then run:

    node tests/workflows.test.cjs
    node tests/website-state.test.cjs

## Contents
- dist/: complete HTML, CSS, JavaScript, Random Forest worker and icon
- README.md: architecture, workflows, supported CSV data and limitations
- tests/: automated regression suites and browser QA notes
- examples/: synthetic CSV for testing; a deliberately invalid schema fixture
- report/: original supplied project report
- FILE_MANIFEST.json: SHA-256 hashes of included files

All training, batch results and review decisions are stored in the browser used to run the app. Existing browser-stored experiments are not included in this source package. You can transfer those separately using the app's model-bundle export. The implementation is JavaScript rather than the report's Python/scikit-learn prototype. Explanations measure model sensitivity; they are not SHAP or causal claims.
