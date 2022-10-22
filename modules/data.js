import fetch from "cross-fetch";
/**
 * @typedef {Object} QueryResponse
 * @property {string[]} questions
 * @property {string} answer
 */
/**
 * @param {string} query
 * @returns {QueryResponse|null}
 */
export const search = async (query) => {
  const faqAnswer = await fetch(
    "https://skyanswerstext.cognitiveservices.azure.com/language/:query-knowledgebases?" +
      new URLSearchParams({
        projectName: "SkyAnswers",
        "api-version": "2021-10-01",
        deploymentName: "production",
      }),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": process.env.AZURE_QA_KEY,
      },
      body: JSON.stringify({
        top: 1,
        question: query,
        confidenceScoreThreshold: 0.3,
      }),
    }
  );
  const { answers } = await faqAnswer.json();
  if (answers.length == 0) {
    console.error(answers);
    throw new Error("something went wrong in faq");
  }
  const [answer] = answers;
  if (answer.answer == `No idea ¯\\_(ツ)_/¯`) return null;
  return answer;
};

let trackedData = {};
export const invalidateTrackedData = () => (trackedData = {});
export const getTrackedData = async (url) => {
  const lastUpdated = trackedData[url]?.lastUpdated;
  if (!lastUpdated || Date.now() - lastUpdated > 1000 * 60 * 60) {
    console.log("refetching", url);
    const resp = await fetch(url);
    trackedData[url] = { data: await resp.json(), lastUpdated: Date.now() };
  }
  return trackedData[url].data;
};
export const queryDownloadable = async (options, query, hosting) => {
  const option = options.find(
    (opt) =>
      opt.id == query || opt.nicknames?.includes?.(query) || opt.display.toLowerCase() == query
  );
  return (
    option && {
      ...option,
      download:
        option.url ||
        "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/" +
          hosting +
          "/" +
          option.file,
    }
  );
};
