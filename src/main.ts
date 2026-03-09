import * as core from '@actions/core';
import * as github from '@actions/github';
import minimatch from 'minimatch';

interface PullRequestFile {
  filename: string;
}

export async function run(): Promise<void> {
  try {
    const token = core.getInput('token', { required: true });
    const globs = core.getInput('globs', { required: true }).split('\n');
    const statuses = core.getInput('statuses', { required: true }).split('\n');
    const octokit = github.getOctokit(token);

    const context = github.context;
    if (context.eventName !== 'pull_request') {
      core.info('Action only runs on pull requests - skipping');
      return;
    }

    const { owner, repo } = context.repo;
    const pull_number = context.issue.number;

    // Additional validation for pull request context
    if (!pull_number) {
      core.info('Changed files are indeterminate (no pull request); skipping');
      return;
    }

    // Get the list of changed files (with pagination to handle >300 files)
    const files: PullRequestFile[] = [];
    for await (const response of octokit.paginate.iterator(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number,
    })) {
      files.push(...response.data);
    }

    // Check if all files match at least one glob pattern
    const allFilesMatch = files.every((file: PullRequestFile) =>
      globs.some((glob: string) => minimatch(file.filename, glob))
    );

    if (!allFilesMatch) {
      core.info('Changed files are not exempt from required statuses');
      return;
    }

    // For pull_request events, context.sha is the ephemeral merge commit;
    // branch protection checks statuses on the PR head commit instead.
    const sha = context.payload.pull_request?.head?.sha;
    if (!sha) {
      core.setFailed('Could not determine pull request head SHA');
      return;
    }

    // Update all status checks to success
    for (const status of statuses) {
      await octokit.rest.repos.createCommitStatus({
        owner,
        repo,
        sha,
        state: 'success',
        context: status,
        description: 'Changed files are exempt from this requirement'
      });
    }

    core.info('Successfully updated all status checks');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
