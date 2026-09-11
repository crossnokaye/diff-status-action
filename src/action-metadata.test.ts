import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('action metadata', () => {
  it('authenticates with a caller-supplied GitHub App', () => {
    const action = readFileSync(resolve(process.cwd(), 'action.yml'), 'utf8');

    expect(action).toContain('  app_id:');
    expect(action).toContain('  private_key:');
    expect(action).not.toContain('  token:');
    expect(action).toContain("using: 'composite'");
    expect(action).toContain('uses: actions/create-github-app-token@v1');
    expect(action).toContain('INPUT_TOKEN: ${{ steps.app-token.outputs.token }}');
    expect(action).toContain('INPUT_GLOBS: ${{ inputs.globs }}');
    expect(action).toContain('INPUT_STATUSES: ${{ inputs.statuses }}');
    expect(action).toContain('node "${{ github.action_path }}/dist/index.js"');
    expect(action).toContain('value: ${{ steps.update-exempted-statuses.outputs.all-match }}');
  });
});
