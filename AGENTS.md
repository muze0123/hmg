# HMG engineering rules

- Frontend implementation rules are in `frontend/AGENTS.md`. Run frontend commands from `frontend/`, or use the root package scripts.
- Keep frontend code in `frontend/`, backend code in `backend/`, API and event contracts in `contracts/`, and deployment configuration in `deploy/`.
- Preserve concurrent edits and existing staged changes. Do not restore deleted files without authorization.
- Business authority and tenant isolation belong on the backend. Keep integration credentials outside source control.
- Root commands proxy to the existing frontend commands. Backend build commands will be added when its executable project is implemented.
