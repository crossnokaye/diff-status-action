# GitHub App Authentication Design

## Goal

Replace the action's public personal access token input with GitHub App
credentials supplied by each caller.

## Public Interface

Version 2 is a breaking change. It removes the `token` input and requires:

- `app_id`: GitHub App ID.
- `private_key`: GitHub App private key.

The README will demonstrate caller-managed secrets named
`DEPLOYMENT_VERIFIER_APP_ID` and `DEPLOYMENT_VERIFIER_PRIVATE_KEY`. These are
example names; callers create and manage their own secrets.

## Authentication Flow

The action will change from a JavaScript action to a composite action. Its
first step uses `actions/create-github-app-token@v1` with `app_id`,
`private_key`, and the current repository owner to mint a short-lived
installation token. Its second step runs the existing bundled JavaScript and
sets `INPUT_TOKEN` to that step's token output.

`@actions/core` resolves `core.getInput('token')` from `INPUT_TOKEN`, so the
existing TypeScript implementation retains its API, pagination, matching, and
status-update behavior without exposing a public `token` input.

The composite action maps its `all-match` output to the Node step's output, so
callers retain the existing output contract.

## Validation

Update the action metadata and README tests, retain unit coverage of the
JavaScript token consumer, rebuild `dist`, and run the project's test, lint,
and build commands.
