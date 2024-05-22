import { z } from 'zod';
import { Octokit } from '@octokit/core';

const octokit = new Octokit({
	auth: process.env.GH_KEY
});

const GHContents = z
	.object({
		path: z.string(),
		encoding: z.literal('base64'),
		content: z.string(),
		sha: z.string(),
		html_url: z.string()
	})
	.transform((v) => ({ ...v, content: atob(v.content), encoding: undefined }));
type GHContent = z.infer<typeof GHContents>;

export async function readGHFile(repo: string, path: string) {
	const { data } = await octokit.request(`GET /repos/${repo}/contents/${path}`);
	return GHContents.parse(data);
}

const repoRegex = /^https:\/\/github\.com\/([^\/]+\/[^\/]+)/;
export async function writeGHFile(oldFile: GHContent, content: string, commitMsg: string) {
	if (oldFile.content == content) return;

	const repo = oldFile.html_url.match(repoRegex)?.at(1);
	if (!repo) throw "this shouldn't happen";

	await octokit.request(`PUT /repos/${repo}/contents/${oldFile.path}`, {
		message: commitMsg,
		committer: {
			name: 'SkyClient-repo-bot',
			email: 'SkyClient-repo-bot@users.noreply.github.com'
		},
		content: btoa(content),
		sha: oldFile.sha
	});
}
