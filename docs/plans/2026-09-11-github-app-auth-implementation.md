# GitHub App Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make version 2 of the action authenticate API requests with a caller-supplied GitHub App rather than a PAT.

**Architecture:** Convert the action manifest to a composite action. Its first step mints an installation token with `actions/create-github-app-token@v1`; the second invokes the bundled Node program with that token in `INPUT_TOKEN`. The TypeScript program remains unchanged because `@actions/core` reads `INPUT_TOKEN` as its internal `token` input.

**Tech Stack:** GitHub Actions composite actions, `actions/create-github-app-token@v1`, Node.js 20, Jest, TypeScript.

---

### Task 1: Specify the public authentication contract

**Files:**
- Create: `src/action-metadata.test.ts`
- Modify: `action.yml`

**Step 1: Write the failing test**

Create `src/action-metadata.test.ts` to read `action.yml` and assert:

```ts
expect(action).toContain('  app_id:');
expect(action).toContain('  private_key:');
expect(action).not.toContain('  token:');
expect(action).toContain("using: 'composite'");
expect(action).toContain('uses: actions/create-github-app-token@v1');
expect(action).toContain('INPUT_TOKEN: ${{ steps.app-token.outputs.token }}');
expect(action).toContain('node "${{ github.action_path }}/dist/index.js"');
expect(action).toContain('value: ${{ steps.update-exempted-statuses.outputs.all-match }}');
```

**Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand src/action-metadata.test.ts`

Expected: FAIL because the manifest still exposes `token` and is a Node action.

**Step 3: Write the minimal implementation**

Replace the public `token` input in `action.yml` with required `app_id` and `private_key` inputs. Change `runs` to a composite action with:

```yaml
- id: app-token
  uses: actions/create-github-app-token@v1
  with:
    app-id: ${{ inputs.app_id }}
    private-key: ${{ inputs.private_key }}
    owner: ${{ github.repository_owner }}
- shell: bash
  env:
    INPUT_TOKEN: ${{ steps.app-token.outputs.token }}
  run: node "${{ github.action_path }}/dist/index.js"
```

Keep `src/main.ts` unchanged: `core.getInput('token')` is an internal interface served by `INPUT_TOKEN`.
Assign the Node step the `update-exempted-statuses` ID and map the composite
action's `all-match` output to `steps.update-exempted-statuses.outputs.all-match`.

**Step 4: Run the test to verify it passes**

Run: `npm test -- --runInBand src/action-metadata.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add action.yml src/action-metadata.test.ts
git commit -m "feat!: authenticate with GitHub App"
```

### Task 2: Document caller credentials

**Files:**
- Modify: `README.md`

**Step 1: Update the usage example**

Replace the `token` example with:

```yaml
app_id: ${{ secrets.DEPLOYMENT_VERIFIER_APP_ID }}
private_key: ${{ secrets.DEPLOYMENT_VERIFIER_PRIVATE_KEY }}
```

**Step 2: Update input documentation**

Document required `app_id` and `private_key` inputs. State that the shown secret names are examples and callers create and manage their own GitHub App secrets.

**Step 3: Verify documentation references**

Run: `rg -n "token|app_id|private_key|DEPLOYMENT_VERIFIER" README.md action.yml`

Expected: no public `token` input remains; the example App secret names and inputs are present.

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: describe GitHub App credentials"
```

### Task 3: Rebuild and verify the action

**Files:**
- Modify if generated output changes: `dist/index.js`, `dist/sourcemap-register.js`, `dist/index.js.map`

**Step 1: Run the full test suite**

Run: `npm test -- --runInBand`

Expected: all Jest suites pass.

**Step 2: Lint TypeScript**

Run: `npm run lint`

Expected: exit code 0.

**Step 3: Rebuild the bundled action**

Run: `npm run build`

Expected: `dist/index.js` is regenerated successfully.

**Step 4: Verify the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only the manifest, documentation, test, generated output if changed, and plan documents are present.

**Step 5: Commit**

```bash
git add dist src/action-metadata.test.ts action.yml README.md docs/plans
git commit -m "build: package GitHub App action v2"
```
