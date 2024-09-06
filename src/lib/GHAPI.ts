import { container } from "@sapphire/framework";
import { Octokit } from "@octokit/rest";
import { envParseString } from "@skyra/env-utilities";
import pmap from "p-map";

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
  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const commitSha = refData.object.sha;

    const { data } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });

    return data.tree.sha;
  } catch (error) {
    container.logger.error("Error retrieving base tree SHA:", error);
    throw error;
  }
}

async function createBlob(
  owner: string,
  repo: string,
  content: string,
  encoding = "utf-8",
) {
  try {
    const { data } = await octokit.git.createBlob({
      owner,
      repo,
      content,
      encoding,
    });
    return data.sha;
  } catch (error) {
    container.logger.error("Error creating blob:", error);
    throw error;
  }
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
  try {
    const tree = files.map((file) => ({
      path: file.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: file.sha,
    }));
    container.logger.debug("tree", tree);

    const { data } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
    });

    return data.sha;
  } catch (error) {
    container.logger.error("Error creating tree:", error);
    throw error;
  }
}

async function createCommit(
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentSha: string,
) {
  try {
    const { data } = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: treeSha,
      parents: [parentSha],
    });

    return data.sha;
  } catch (error) {
    container.logger.error("Error creating commit:", error);
    throw error;
  }
}

async function updateReference(
  owner: string,
  repo: string,
  branch: string,
  commitSha: string,
) {
  try {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: commitSha,
    });
  } catch (error) {
    container.logger.error("Error updating reference:", error);
    throw error;
  }
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
  container.logger.debug("baseTreeSha", baseTreeSha);

  const blobs: Blob[] = await pmap(files, async (file) => {
    const sha = await (typeof file.content == "string"
      ? createBlob(owner, repo, file.content)
      : createBinaryBlob(owner, repo, file.content));
    return { path: file.path, sha };
  });
  container.logger.debug("blobs", blobs);

  const treeSha = await createTree(owner, repo, baseTreeSha, blobs);
  container.logger.debug("treeSha", treeSha);
  const commitSha = await createCommit(
    owner,
    repo,
    message,
    treeSha,
    baseTreeSha,
  );
  container.logger.debug("commitSha", commitSha);
  await updateReference(owner, repo, branch, commitSha);
}
