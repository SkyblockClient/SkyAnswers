import { Octokit } from "@octokit/rest";
import { envParseString } from "@skyra/env-utilities";

export const octokit = new Octokit({ auth: envParseString("GH_KEY", null) });
export const committer = {
  name: "SkyClient-repo-bot",
  email: "SkyClient-repo-bot@users.noreply.github.com",
};

type GHContent = {
  path: string;
  repo: string;
  content: string;
  sha: string;
};

export async function readGHFile(
  repo: string,
  path: string,
): Promise<GHContent> {
  let { data: rawData } = await octokit.rest.repos.getContent({
    owner: repo.split("/")[0],
    repo: repo.split("/")[1],
    path,
  });

  const data = Array.isArray(rawData) ? rawData[0] : rawData;

  if (data.type != "file") throw "not a file";
  if (!data.content) throw "no content";

  return { path, repo, content: atob(data.content), sha: data.sha };
}

export async function writeGHFile(
  oldFile: GHContent,
  content: string,
  commitMsg: string,
) {
  if (oldFile.content == content) return;

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: oldFile.repo.split("/")[0],
    repo: oldFile.repo.split("/")[1],
    path: oldFile.path,

    committer,
    message: commitMsg,
    content: btoa(content),
    sha: oldFile.sha,
  });
}
