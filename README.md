# Diff Status Action

A GitHub Action that validates changed files against glob patterns and updates status checks accordingly.

## Usage

```yaml
name: Validate Changed Files
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: xeger/diff-status-action@v2
        with:
          globs: |
            **/*.md
            LICENSE
          statuses: |
            deploy-production
            deploy-staging
          app_id: ${{ secrets.VERSION_CONTROLLER_APP_ID }}
          private_key: ${{ secrets.VERSION_CONTROLLER_PRIVATE_KEY }}
```

## Inputs

### `app_id`

**Required** The GitHub App ID used to authenticate API requests.

### `private_key`

**Required** The GitHub App private key used to authenticate API requests.

The secret names in the example are illustrative. Callers are responsible for creating and managing their own GitHub App secrets.

### `globs`

**Required** A newline-separated list of glob patterns to match against changed files. Each changed file must match at least one pattern.

### `statuses`

**Required** A newline-separated list of status check names to update. All statuses will be marked as successful if all files match the glob patterns.

## Outputs

None.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the action:
   ```bash
   npm run build
   ```

3. Run tests:
   ```bash
   npm test
   ```

## License

MIT
