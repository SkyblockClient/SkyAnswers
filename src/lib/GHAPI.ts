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
  const { data: rawData } = await octokit.rest.repos.getContent({
    owner: repo.split("/")[0],
    repo: repo.split("/")[1],
    path,
  });

  const data = Array.isArray(rawData) ? rawData[0] : rawData;

  if (data.type != "file") throw new Error("not a file");
  if (!data.content) throw new Error("no content");

  return { path, repo, content: atob(data.content), sha: data.sha };
}

export async function readGHContent(
  repo: string,
  path: string,
): Promise<string> {
  const { content } = await readGHFile(repo, path);
  return content;
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

async function getBaseTreeSha(owner: string, repo: string, branch: string) {
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const commitSha = refData.object.sha;

  const { data: commitData } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: commitSha,
  });

  return commitData.tree.sha;
}

async function createBlob(
  owner: string,
  repo: string,
  content: string,
  encoding = "utf-8",
) {
  const { data } = await octokit.git.createBlob({
    owner,
    repo,
    content,
    encoding,
  });
  return data.sha;
}

async function createBinaryBlob(
  owner: string,
  repo: string,
  content: ArrayBuffer,
) {
  const base64Content = Buffer.from(content).toString("base64");
  return createBlob(owner, repo, base64Content, "base64");
}

async function createTree(
  owner: string,
  repo: string,
  baseTreeSha: string,
  files: Blob[],
) {
  const tree = files.map((file) => ({
    path: file.path,
    mode: "100644" as const,
    type: "blob" as const,
    sha: file.sha,
  }));

  const { data } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree,
  });

  return data.sha;
}

export interface FileToCommit {
  path: string;
  content: string | ArrayBuffer;
}

interface Blob {
  path: string;
  sha: string;
}

export async function commitFiles(
  owner: string,
  repo: string,
  branch: string,
  message: string,
  files: FileToCommit[],
) {
  const baseTreeSha = await getBaseTreeSha(owner, repo, branch);

  const blobs: Blob[] = await Promise.all(
    files.map(async (file) => {
      const sha = await (typeof file.content == "string"
        ? createBlob(owner, repo, file.content)
        : createBinaryBlob(owner, repo, file.content));
      return { path: file.path, sha };
    }),
  );

  const treeSha = await createTree(owner, repo, baseTreeSha, blobs);
  const { data: commitData } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: treeSha,
    parents: [baseTreeSha],
    committer,
  });
  const { sha: commitSha } = commitData;

  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commitSha,
  });
}
