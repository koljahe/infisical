# Testbot vs Claude Code: A/B Comparison

## Application Overview

Infisical is an open-source secret management platform. Think of it as a self-hosted Vault/1Password for engineering teams. Users create organizations, create projects within those organizations, and manage secrets (key-value pairs) across environments (dev, staging, prod). Access is controlled via RBAC with org-level and project-level permissions.

### Backend (Fastify + TypeScript)

**Core API Domains:**
| Domain | Routes | What it does |
|--------|--------|--------------|
| Auth | v1, v2, v3 | Email/password login, SSO (SAML/OIDC/LDAP), MFA, session management |
| Users & Orgs | v1, v2 | User profiles, org CRUD, membership, invites |
| Projects | v1 | Project CRUD, environments, encryption keys, membership |
| Secrets | v1–v4 | Secret CRUD, folders, tags, imports, versions, snapshots, sharing |
| Identities | v1, v2 | Machine-to-machine auth (13 auth methods: JWT, AWS, Azure, GCP, K8s, OIDC, etc.) |
| PKI/Certificates | v1, v2 | Certificate authorities, issuance, templates, profiles, policies, ACME/EST/SCEP |
| Integrations | v1 | 50+ third-party sync targets (AWS SM, GitHub, Vercel, etc.) |
| Access Control | v1 (EE) | Approval policies, access requests, trusted IPs |
| Audit | EE | Audit logging, log streams (ClickHouse) |
| KMS | v1 (EE) | Key management, KMIP server |
| SSH | EE | SSH CA, certificates, host management |
| PAM | EE | Privileged access management (accounts, sessions, discovery) |

**Architecture:**
- 120+ services with manual DI (factory functions, wired in `src/server/routes/index.ts`)
- PostgreSQL via Knex (276 tables), Redis for caching/sessions, ClickHouse for audit logs
- BullMQ for async jobs (30+ named queues)
- CASL-based permissions with two-tier cache
- 7 auth modes (JWT, MCP_JWT, API_KEY, SERVICE_TOKEN, IDENTITY_ACCESS_TOKEN, SCIM_TOKEN, GATEWAY_ACCESS_TOKEN)
- Rate limiting per route

**Existing Tests:**
- 33 unit test files (`backend/src/**/*.test.ts`) — services, validators, crypto
- 28 e2e test files (`backend/e2e-test/routes/**/*.spec.ts`) — auth, secrets, folders, imports, orgs, identities
- Framework: Vitest
- Test DB spun up via docker-compose (`db-test` service on port 5430)
- Test utilities in `backend/e2e-test/testUtils/` (auth helpers, cookie extraction, folder/secret factories)

### Frontend (React 18 + Vite 6)

**Core Feature Areas:**
| Feature | Description |
|---------|-------------|
| Secret Manager | Browse/edit secrets by environment, folder structure, version history, rollback |
| Certificate Manager (PKI) | CA management, cert issuance, discovery, templates, alerting |
| SSH | SSH CA and certificate management |
| KMS | Key management, KMIP |
| PAM | Privileged accounts, sessions, approvals |
| AI/MCP | MCP server and endpoint management |
| Organization | Members, groups, roles, billing, SSO config, audit logs |
| Integrations | 50+ integration setup wizards |

**Architecture:**
- TanStack Router v1 (type-safe, file-based routes)
- React Query v5 for server state (60-second stale time, query key factories per domain)
- 67 API hook domains in `src/hooks/api/`
- CASL-based permission HOCs and hooks (`useOrgPermission()`, `useProjectPermission()`)
- Radix UI + Tailwind CSS v4 component library (v3 design system)
- React Hook Form + Zod validation
- 13 layout components for different product areas
- i18next for internationalization

**Existing Tests:** None. No test framework configured, no test scripts in package.json.

---

## PR List for Comparison

Each PR is a full-stack change (backend + frontend) of increasing complexity. This ensures both tools have meaningful material across the entire stack.

### PR 0: Proof of concept (dummy)
**Change:** Add a `GET /api/v1/status/version` endpoint returning `{ version, buildDate }` + display it in the frontend admin settings page.
**Why:** Validates the full pipeline works — testbot triggers, Claude prompt works, both produce tests.
**Expected test types:** Contract test (response shape), UI test (version displayed).

### PR 1: Add project activity summary
**Change:** New `GET /api/v1/projects/:projectId/activity-summary` endpoint returning recent activity counts (secrets created/updated/deleted in last 7d). Frontend: new "Activity" card on the project overview page showing a mini bar chart.
**Why interesting:** Backend needs auth + permission checks + date-range query logic. Frontend needs component rendering with data, empty states, loading states.
**Expected test types:** Contract tests (API schema), integration tests (auth, permissions, data correctness), UI tests (card renders, handles empty/loading).

### PR 2: Secret expiry notifications
**Change:** Add an optional `expiresAt` field to secrets. Backend: new DB column, migration, validation in create/update endpoints, new `GET /api/v1/projects/:projectId/secrets/expiring` endpoint listing soon-to-expire secrets. Frontend: expiry date picker in secret edit form, warning badge on secrets nearing expiry, "Expiring Secrets" panel in project dashboard.
**Why interesting:** Modifies existing core secret CRUD (high regression risk), adds new UI interactions, date boundary logic, needs backward compatibility (existing secrets without expiry).
**Expected test types:** Contract tests (new/modified endpoints), integration tests (expiry logic, backward compat), UI tests (date picker, badges, panel).

### PR 3: Bulk secret operations
**Change:** Add `POST /api/v1/projects/:projectId/secrets/bulk-delete` and `POST /api/v1/projects/:projectId/secrets/bulk-move` endpoints for batch operations. Frontend: multi-select checkbox UI in the secrets list, bulk action toolbar (delete, move to folder), confirmation dialogs.
**Why interesting:** Batch operations have complex failure modes (partial success, permission per-secret, transactional integrity). Frontend has interaction state (selection tracking, optimistic UI updates, error recovery).
**Expected test types:** Contract tests (batch request/response shapes), integration tests (partial failures, auth per-item, atomicity), UI tests (select/deselect, toolbar visibility, confirmation flow, error display).

### PR 4: Secret comments / discussion thread
**Change:** Full-stack feature — team members can leave comments on individual secrets (think GitHub PR comments). Backend: new `secret_comments` table, migration, CRUD endpoints with permission checks (project members only), real-time count. Frontend: comment thread UI in secret detail drawer, comment composer, timestamp + author display, empty state.
**Why interesting:** Net-new feature spanning DB schema, multiple API endpoints (list, create, delete), permission model (who can comment, who can delete), and rich frontend interaction (optimistic updates, form validation, threading).
**Expected test types:** Contract tests (all CRUD endpoints), integration tests (permissions, ordering, pagination), UI tests (compose, display, delete, empty state, loading).

---

## Evaluation Criteria

### Quantitative Metrics

| Metric | How to measure | Scoring |
|--------|---------------|---------|
| **Setup time** | Time from prompt/trigger to first test file written | Lower is better (seconds) |
| **Time to green** | Time from start to all generated tests passing | Lower is better (minutes) |
| **Tests generated** | Count of test cases (not files) | More is better, weighted by quality |
| **Test pass rate** | % of generated tests that pass on first run without modification | Higher is better |
| **Manual intervention** | Number of human edits needed to get tests passing | Lower is better (0 = fully autonomous) |
| **Coverage delta** | New lines/branches covered (measured via `vitest --coverage`) | Higher is better |

### Qualitative Metrics (Score 1-5 per dimension)

| Dimension | 1 (Poor) | 3 (Adequate) | 5 (Excellent) |
|-----------|----------|--------------|---------------|
| **Behavioral coverage** | Only tests happy path (200 OK) | Tests main paths + basic errors | Tests happy path, errors, edge cases, boundary conditions |
| **Auth/permission testing** | Ignores auth entirely | Tests authenticated vs unauthenticated | Tests per-role access (admin, member, viewer, no-access) |
| **Input validation** | No validation tests | Tests obviously invalid input | Tests type coercion, boundary values, injection attempts |
| **Negative cases** | None | Tests 404/400 basics | Tests race conditions, concurrent access, resource conflicts |
| **Test isolation** | Tests depend on each other / shared state | Mostly isolated with some cleanup | Fully isolated, proper setup/teardown, no test ordering dependency |
| **Test readability** | Unclear intent, no structure | Grouped by feature, named adequately | Clear describe/it structure, test names explain the requirement |
| **Recommendations quality** | Generic "add more tests" | Identifies specific untested paths | Identifies business logic gaps, security concerns, regression risks |

### Process Metrics

| Metric | Testbot | Claude Code |
|--------|---------|-------------|
| **Human effort** | Zero (fully autonomous trigger-to-result) | Prompt writing + review |
| **Context available** | Git diff only | Full session context (made the change) |
| **SUT access** | Yes (docker-compose.bdd.yml on CI) | Yes (docker-compose.dev.yml locally) |
| **Iteration capability** | Single pass (retry on failure) | Multi-turn (can debug and fix) |

---

## Comparison Protocol

### Participants & What They Do

Each feature produces **4 test results** from **2 sessions + 2 testbot triggers**:

| Participant | Task | Context at start | SUT Access |
|-------------|------|------------------|------------|
| **Claude Opus 4.6** | Implement + self-validate (tests) | Feature spec only (fresh session) | Local (docker-compose.bdd.yml) |
| **Testbot (on Opus PR)** | Generate tests for Opus's code | Git diff only | CI (docker-compose.bdd.yml) |
| **Claude Sonnet 4.6** | Implement + self-validate (tests) | Feature spec only (fresh session) | Local (docker-compose.bdd.yml) |
| **Testbot (on Sonnet PR)** | Generate tests for Sonnet's code | Git diff only | CI (docker-compose.bdd.yml) |

**Flow per session:** Claude implements the feature → pushes a PR (which triggers testbot automatically) → then deploys locally and writes + runs its own tests in the same session.

**What this gives you:**
- Direct comparison of Claude's self-generated tests vs. testbot's tests *on the same code*
- Cross-model comparison of implementation quality
- Cross-model comparison of test quality
- Testbot consistency check (does it produce similar tests for similar implementations?)

### Fairness Constraints

1. **Fresh session** — spawn a new `claude` process with `--new-session`. No conversation history, no memory of previous runs.
2. **No contamination** — comparison docs (`COMPARISON.md`, `TESTBOT_FIX_CONTEXT.md`, `tests/`) live only on the `comparison` meta-branch, never on `main` or PR branches. Claude sessions check out clean PR base branches.
3. **Same prompt** — identical for both models (see below).
4. **No human intervention** — do not answer questions, provide hints, or correct course. If Claude asks something, respond "Use your best judgment." If it loops without progress for >5 minutes, record as failure.
5. **Same SUT** — `docker-compose.bdd.yml` for all (same compose testbot uses in CI).
6. **Independent implementations** — Opus and Sonnet implement independently. Their code will differ. That's the point — evaluates the full workflow, not just tests.

### Branch Structure

```
fork/main (clean — BDD infra + testbot workflow only, NO comparison docs)
│
├── pr1/opus    ← Opus implements feature 1, opens PR → triggers testbot
├── pr1/sonnet  ← Sonnet implements feature 1, opens PR → triggers testbot
│
├── pr2/opus    ← ...
├── pr2/sonnet  ← ...
│
└── comparison  ← COMPARISON.md, TESTBOT_FIX_CONTEXT.md, data sheets
                   (your working branch for docs — never checked out during runs)
```

**Why this works:**
- Claude sessions start from `fork/main` — clean slate, no test files, no comparison docs, no hints
- Each session creates + pushes its own branch and opens a PR → testbot triggers automatically
- Both testbot runs are independent (different PRs, possibly different implementations)
- `comparison` branch is invisible during runs — holds only your evaluation docs
- The `CLAUDE.md` files in the repo give Claude the same architectural context any developer would have (this is fair game — it's project documentation, not test hints)

### Execution Order (per feature)

```
1. Write the feature spec (one-time, used for both sessions)
2. Run Claude Opus session:
   - checkout fork/main (clean)
   - paste prompt with spec
   - Claude implements → pushes PR → testbot triggers automatically
   - Claude then deploys locally, writes tests, iterates until green
3. Run Claude Sonnet session (after Opus finishes):
   - tear down any local SUT
   - checkout fork/main (clean)
   - paste prompt with spec
   - Claude implements → pushes PR → testbot triggers automatically
   - Claude then deploys locally, writes tests, iterates until green
4. Wait for both testbot runs to complete
5. Collect all 4 data points
```

Order is Opus first, then Sonnet (arbitrary but consistent). Each session is fully independent — they never see each other's code.

### Standardized Prompt (for Claude sessions)

Use this exact template. Replace `{N}`, `{MODEL}`, and `{FEATURE_SPEC}` before pasting.

```
Implement the feature described below, then validate it with tests.

## Setup

- Create a branch called `pr{N}/{MODEL}` from the current HEAD.
- This is a monorepo: backend is Fastify+TypeScript in `backend/`, frontend is React+Vite in `frontend/`.
- When done implementing, push the branch and open a PR against `main` on the `koljahe/infisical` fork.

## Feature to implement

{FEATURE_SPEC}

## After implementation, validate your work

1. Deploy: docker compose -f docker-compose.bdd.yml up -d --build
2. Wait: curl -sf http://localhost:8080/api/status (retry until 200)
3. Bootstrap admin: curl -sf -X POST http://localhost:8080/api/v1/admin/bootstrap \
   -H "Content-Type: application/json" \
   -d '{"email":"admin@test.com","password":"Password123!","organization":"TestOrg"}'
   (auth token is at .identity.credentials.token in the response)
4. Write contract, integration, and UI tests in a `tests/` directory at the repo root.
5. Run the tests against the deployed app. Iterate until all pass.
```

### How to Launch Each Run

```bash
# ══════════════════════════════════════
# ── OPUS RUN ──
# ══════════════════════════════════════
cd /path/to/infisical
docker compose -f docker-compose.bdd.yml down -v 2>/dev/null
git fetch fork main && git checkout fork/main --detach

# Create .env
cp .env.dev.example .env
sed -i '' "s#ENCRYPTION_KEY=.*#ENCRYPTION_KEY=6c1fe4e407b8911c104518103505b218#" .env
sed -i '' "s#SMTP_HOST=.*#SMTP_HOST=#" .env
sed -i '' "s#SMTP_PORT=.*#SMTP_PORT=#" .env
sed -i '' "s#SMTP_FROM_ADDRESS=.*#SMTP_FROM_ADDRESS=#" .env
sed -i '' "s#SMTP_FROM_NAME=.*#SMTP_FROM_NAME=#" .env

# Record start state
echo "Start: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Base commit: $(git rev-parse --short HEAD)"

# Launch (hands off after pasting prompt)
claude --model opus --new-session

# After session ends:
echo "End: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
# Use /cost in the session before quitting to capture token usage
```

```bash
# ══════════════════════════════════════
# ── SONNET RUN ── (after Opus finishes)
# ══════════════════════════════════════
docker compose -f docker-compose.bdd.yml down -v 2>/dev/null
git checkout fork/main --detach

# Same .env setup (or it may still be there from Opus run — verify)

echo "Start: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Base commit: $(git rev-parse --short HEAD)"

claude --model sonnet --new-session
# Paste prompt with pr{N}/sonnet. Hands off.

echo "End: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

```bash
# ══════════════════════════════════════
# ── CHECK TESTBOT RESULTS ──
# ══════════════════════════════════════
# Both PRs should have triggered testbot automatically when Claude pushed them.
# Check status:
gh run list --repo koljahe/infisical --workflow "Skyramp Testbot" --limit 4

# Read testbot comments:
gh api repos/koljahe/infisical/issues/{OPUS_PR_NUMBER}/comments --jq '.[-1].body'
gh api repos/koljahe/infisical/issues/{SONNET_PR_NUMBER}/comments --jq '.[-1].body'
```

---

## Data Collection Sheet

### Per-Run Record

Fill one per participant per feature (**4 records per feature**: opus-self, testbot-on-opus, sonnet-self, testbot-on-sonnet).

```
Feature:     #[N] — [title]
Participant: [claude-opus | claude-sonnet | testbot-on-opus | testbot-on-sonnet]
Branch:      [branch name]
PR:          #[PR number]
Commit SHA:  [short sha of final commit]
Date:        [YYYY-MM-DD]

── Timing ──
Start:               [HH:MM:SS UTC]
Implementation done: [HH:MM:SS UTC]  (N/A for testbot)
PR pushed:           [HH:MM:SS UTC]  (N/A for testbot)
All tests pass:      [HH:MM:SS UTC]  (or "never")
End:                 [HH:MM:SS UTC]
Total duration:      [Xm Ys]
  - Implementation:  [Xm Ys]  (start → impl done; N/A for testbot)
  - Testing:         [Xm Ys]  (impl done → all pass; = total for testbot)

── Implementation Output (Claude only) ──
Files changed:       [N]
Lines added:         [N]
Lines removed:       [N]
Backend changes:     [Y/N + brief]
Frontend changes:    [Y/N + brief]
Migration added:     [Y/N]

── Test Output ──
Test files generated:      [N]
Test cases generated:      [N]  (count of it/test blocks)
  - Contract tests:        [N]
  - Integration tests:     [N]
  - UI tests:              [N]
Tests passing (first run): [N/N]  (before any self-correction)
Tests passing (final):     [N/N]
Self-correction rounds:    [N]   (testbot: always 1)

── Cost ──
Input tokens:   [N]
Output tokens:  [N]
Cache read:     [N]
Estimated cost: [$X.XX]  (testbot: "license")

── Qualitative Scores (1-5) ──
Behavioral coverage:      [1-5]
Auth/permission testing:  [1-5]
Input validation:         [1-5]
Negative cases:           [1-5]
Test isolation:           [1-5]
Test readability:         [1-5]
Recommendations quality:  [1-5]

── Implementation Quality (Claude only, 1-5) ──
Code correctness:         [1-5]  (does the feature work as specified?)
Code style consistency:   [1-5]  (matches existing patterns in the repo?)
Completeness:             [1-5]  (all parts of the spec addressed?)

── Notes ──
[Free-form: what stood out, failures, interesting decisions, etc.]
```

### Summary Table (filled after all features)

```
| Feature | Metric                  | Testbot (Opus PR) | Testbot (Sonnet PR) | Claude Opus | Claude Sonnet |
|---------|-------------------------|-------------------|---------------------|-------------|---------------|
| 0       | Total duration          |                   |                     |             |               |
| 0       | Test cases              |                   |                     |             |               |
| 0       | First-run pass rate     |                   |                     |             |               |
| 0       | Final pass rate         |                   |                     |             |               |
| 0       | Avg qualitative (tests) |                   |                     |             |               |
| 0       | Impl quality            | N/A               | N/A                 |             |               |
| 0       | Cost                    | license           | license             |             |               |
|---------|-------------------------|-------------------|---------------------|-------------|---------------|
| ...     | ...                     |                   |                     |             |               |
|---------|-------------------------|-------------------|---------------------|-------------|---------------|
| AVG     | Total duration          |                   |                     |             |               |
| AVG     | Test cases              |                   |                     |             |               |
| AVG     | First-run pass rate     |                   |                     |             |               |
| AVG     | Final pass rate         |                   |                     |             |               |
| AVG     | Qualitative (tests)     |                   |                     |             |               |
| AVG     | Impl quality            | N/A               | N/A                 |             |               |
| TOTAL   | Cost                    | license           | license             |             |               |
```

### Key Comparisons to Draw

1. **Claude self-test vs. testbot on same code** — who writes better tests for Opus's implementation? For Sonnet's?
2. **Opus vs. Sonnet implementation quality** — does the more capable model produce better code?
3. **Opus vs. Sonnet test quality** — does implementation context help test quality?
4. **Testbot consistency** — does testbot produce similar quality tests regardless of whose code it sees?
5. **Speed vs. depth** — does testbot's single-pass speed trade off against Claude's iterative depth?

---

## Pre-Run Checklist

- [ ] `fork/main` is clean (has BDD infra, workflow; no comparison docs or test artifacts)
- [ ] No leftover containers: `docker compose -f docker-compose.bdd.yml down -v`
- [ ] `.env` created with standard overrides
- [ ] Checked out `fork/main` at expected commit
- [ ] Comparison docs (`COMPARISON.md` etc.) are NOT on the current branch
- [ ] Feature spec written and ready to paste
- [ ] Record start timestamp and commit SHA before launching Claude

---

## Handling the Comparison Docs

These files exist for your reference but must NOT be visible to Claude sessions:

| File | Purpose | Where it lives |
|------|---------|----------------|
| `COMPARISON.md` | Protocol + results | `comparison` branch only |
| `TESTBOT_FIX_CONTEXT.md` | Historical — how we fixed the infra | `comparison` branch only |
| `tests/` (existing) | Local test artifacts from infra debugging | `comparison` branch only |

**Setup (one-time) — run before first real comparison:**
```bash
# 1. Create the comparison branch with all meta-docs
git checkout fork/main
git checkout -b comparison
git add COMPARISON.md TESTBOT_FIX_CONTEXT.md tests/
git commit -m "docs: comparison protocol and data collection"
git push fork comparison

# 2. Also remove the old pr0/version-endpoint PR branch artifacts from main
#    (the existing tests/ dir, COMPARISON.md, TESTBOT_FIX_CONTEXT.md)
git checkout fork/main
git rm -f COMPARISON.md TESTBOT_FIX_CONTEXT.md
git rm -rf tests/
git commit -m "chore: remove comparison docs from main (live on comparison branch)"
git push fork main
```

**To edit comparison docs later:**
```bash
git checkout comparison
# edit files
git commit -am "update results"
git push fork comparison
```

**Verify main is clean before a run:**
```bash
git fetch fork main
git log fork/main --oneline -1  # should NOT have comparison docs
git ls-tree fork/main | grep -E "COMPARISON|TESTBOT_FIX|tests/"  # should return nothing
```

---

## Feature Specs (for prompts)

These are the feature descriptions you paste into the Claude prompt. Keep them spec-level (what to build, not how).

### Feature 0: Server Version Endpoint
Add a `GET /api/status/version` endpoint that returns `{ version, buildTimestamp, nodeVersion }`. Display the info in a "Version Info" card on the admin General settings page (`/admin`) with `data-testid` attributes: `server-version`, `build-timestamp`, `node-version`.

### Feature 1: Project Activity Summary
*[To be written before running]*

### Feature 2: Secret Expiry Notifications
*[To be written before running]*

### Feature 3: Bulk Secret Operations
*[To be written before running]*

### Feature 4: Secret Comments
*[To be written before running]*

---

## Results

### Feature 0: Server Version Endpoint

#### Claude Opus 4.6 (implement + self-test)
*Not yet run*

#### Testbot on Opus PR
*Depends on Opus run*

#### Claude Sonnet 4.6 (implement + self-test)
*Not yet run*

#### Testbot on Sonnet PR
*Depends on Sonnet run*

#### Historical note (pre-protocol testbot run)
The earlier testbot run (26873933479) was against a manually-written implementation on `pr0/version-endpoint`. That data is useful for reference but doesn't follow the current protocol (no matching Claude self-test on same code). Consider re-running feature 0 cleanly or starting fresh from feature 1.

---

## Open Items

1. **Move comparison docs to `comparison` branch** — run the one-time setup above. Until this is done, Claude sessions will see `COMPARISON.md` and the experiment is contaminated.
2. **Close/clean existing PRs** — PR #4 and PR #9 on the fork are from the old setup. Close them and delete the `pr0/version-endpoint` branch from fork, or leave as historical reference.
3. **Feature specs for 1-4** — write before running. Should be ~1 paragraph each: what to build, what UI to show, what data-testids to use. Not how.
4. **Decide: start fresh from feature 0 or skip to 1?** — The existing PR #0 was hand-implemented. For a clean protocol you'd re-run it with both models. Alternatively, accept it as a warm-up and start the real comparison at feature 1.
5. **Token/cost tracking** — use `/cost` in each Claude session before quitting.
6. **Qualitative scoring** — decide who scores (you alone, or bring in a second evaluator for blinding?).
