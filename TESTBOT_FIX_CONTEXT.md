# Testbot Fix Context

## Goal
Make testbot UI tests pass on PR #4 (koljahe/infisical). Currently contract tests pass but UI tests fail because Playwright times out waiting for the login form to render (3s internal timeout in testbot's SmartPlaywright).

## Current State

### What works
- Testbot triggers on PRs to `koljahe/infisical` (fork)
- SUT builds and boots via `docker-compose.bdd.yml` with proper `.env`
- Health check passes (`curl -sf http://localhost:8080/api/status`)
- Admin bootstrap works: `POST /api/v1/admin/bootstrap` with `{"email":"admin@test.com","password":"Password123!","organization":"TestOrg"}`
- Contract test passes (GET /api/status/version returns correct JSON)
- Auth token is obtained via `authTokenCommand` in workflow

### What fails
- UI tests timeout at 3s waiting for login form email input to appear
- The frontend (Vite dev server in Docker) takes longer than 3s to hydrate on a cold CI runner
- This is testbot's internal SmartPlaywright timeout, NOT our infrastructure

### PR under test
- PR #4: https://github.com/koljahe/infisical/pull/4
- Branch: `pr0/version-endpoint`
- Change: Added `GET /api/status/version` endpoint + `VersionInfoSection` card on admin general page

## Repository Setup

### Git remotes
- `origin` → `org-107880645@github.com:Infisical/infisical.git` (upstream)
- `fork` → `git@github.com:koljahe/infisical.git` (our fork)

### Key branches
- `fork/main` — has testbot workflow, no other CI workflows
- `pr0/version-endpoint` — the test PR (1 commit ahead of fork/main)

### Workflow file
`.github/workflows/skyramp-testbot.yml` on `fork/main`

Current config:
```yaml
targetSetupCommand: 'docker compose -f docker-compose.bdd.yml up -d --build'
targetReadyCheckCommand: 'curl -sf http://localhost:8080/api/status'
targetReadyCheckTimeout: '300'
authTokenCommand: 'curl -sf -X POST http://localhost:8080/api/v1/admin/bootstrap -H "Content-Type: application/json" -d "{\"email\":\"admin@test.com\",\"password\":\"Password123!\",\"organization\":\"TestOrg\"}" | jq -r ".identity.credentials.token"'
uiCredentials: 'username=admin@test.com;password=Password123!;role=admin'
targetTeardownCommand: 'docker compose -f docker-compose.bdd.yml down -v'
```

### .env creation (in workflow step before testbot):
```bash
cp .env.dev.example .env
sed -i "s#ENCRYPTION_KEY=.*#ENCRYPTION_KEY=6c1fe4e407b8911c104518103505b218#" .env
sed -i "s#SMTP_HOST=.*#SMTP_HOST=#" .env
sed -i "s#SMTP_PORT=.*#SMTP_PORT=#" .env
sed -i "s#SMTP_FROM_ADDRESS=.*#SMTP_FROM_ADDRESS=#" .env
sed -i "s#SMTP_FROM_NAME=.*#SMTP_FROM_NAME=#" .env
```

## What to investigate / fix

### Option A: Fix the timeout issue
The testbot SmartPlaywright uses a 3s timeout for element waits. Look at the testbot action inputs in `action.yml` at https://github.com/letsramp/testbot — check if there's a configurable timeout for Playwright waits. Key inputs to look at:
- `testExecutionTimeout` (default 300s — but this is for MCP tool calls, not element waits)
- Any undocumented inputs for playwright timeout

### Option B: Pre-warm the frontend
Add a step after `targetReadyCheckCommand` passes that also hits the frontend to pre-warm it:
```
targetReadyCheckCommand: 'curl -sf http://localhost:8080/api/status && curl -sf http://localhost:8080 > /dev/null'
```
This forces Vite to compile the frontend bundle before testbot tries to interact with it.

### Option C: Use the non-dev frontend
The BDD compose uses `frontend/Dockerfile.dev` (Vite dev server — slow first load, compiles on demand). Consider switching to a production build of the frontend that serves pre-compiled static assets. This would be faster on CI but requires changing the compose.

### Option D: Check if login URL needs to be different
The frontend might redirect `/admin` to `/login` or `/admin/signup` depending on state. After bootstrap, the correct login URL might be `http://localhost:8080/login`. Testbot's `uiCredentials` should handle this, but verify the login page URL pattern.

## How to verify locally

1. Bring up the stack:
```bash
docker compose -f docker-compose.dev.yml up -d
# Wait for health
until curl -sf http://localhost:8080/api/status; do sleep 5; done
```

2. Bootstrap admin:
```bash
curl -sf -X POST http://localhost:8080/api/v1/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Password123!","organization":"TestOrg"}'
```

3. Run a Playwright test that:
   - Goes to http://localhost:8080/login
   - Waits for email input (measure time)
   - Fills admin@test.com / Password123!
   - Submits
   - Navigates to /admin
   - Asserts `[data-testid="server-version"]` is visible

4. If it works locally, the issue is CI timing. Fix by pre-warming or increasing timeout.

## How to push fixes

1. Create branch off fork/main:
```bash
git fetch fork main
git checkout -b fix/testbot-ui fork/main
```

2. Edit `.github/workflows/skyramp-testbot.yml`

3. Commit and push:
```bash
git add .github/workflows/skyramp-testbot.yml
git commit -m "fix(ci): ..."
git push fork fix/testbot-ui
```

4. Create PR and merge:
```bash
gh pr create --repo koljahe/infisical --base main --head fix/testbot-ui --title "fix: ..." --body "..."
gh pr merge --repo koljahe/infisical --merge --admin fix/testbot-ui
```

5. Rebase PR #4 and re-trigger:
```bash
git checkout pr0/version-endpoint
git fetch fork main
git rebase fork/main
git push fork pr0/version-endpoint --force-with-lease
```

6. Monitor:
```bash
gh run list --repo koljahe/infisical --workflow "Skyramp Testbot" --limit 1
gh run watch <run-id> --repo koljahe/infisical
```

7. Check results:
```bash
gh api repos/koljahe/infisical/issues/4/comments | python3 -c "import json,sys; data=json.load(sys.stdin); print(data[-1]['body'])"
```

## Success criteria
- All testbot-generated tests pass (contract AND UI)
- `fork/main` is clean so new PRs work without any manual intervention
