import fetch from "cross-fetch";
/**
 * @typedef {Object} QueryResponse
 * @property {string[]} questions
 * @property {string} answer
 */
/**
 * @param {string} query
 * @returns {Promise<QueryResponse|null>}
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
export const searchEmbed = async (query) => {
  const answer = await search(query);
  if (!answer) {
    return {
      embeds: [
        {
          title: "Nothing relevant in the FAQ found",
          color: 0xff8888,
        },
      ],
    };
  }
  return {
    embeds: [
      {
        title: `FAQ: ${answer.questions[0]}`,
        description: answer.answer,
        color: 0x88ff88,
      },
    ],
  };
};

let trackedData = {};
export const invalidateTrackedData = () => (trackedData = {});
export const getTrackedData = async (url) => {
  const lastUpdated = trackedData[url]?.lastUpdated;
  if (!lastUpdated || Date.now() - lastUpdated > 1000 * 60 * 60) {
    console.log("refetching", url);
    let data;
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`http error ${resp.statusText} while fetching ${url}`);
      }
      data = await resp.json();
    } catch (e) {
      throw new Error(`exception ${e} while fetching ${url}`);
    }
    trackedData[url] = { data, lastUpdated: Date.now() };
  }
  return trackedData[url].data;
};
export const queryDownloadable = async (options, query, hosting) => {
  const option = options.find(
    (opt) =>
      opt.id == query ||
      opt.nicknames?.includes?.(query) ||
      opt.display?.toLowerCase() == query
  );
  return (
    option && {
      ...option,
      download:
        option.url ||
        "https://raw.githubusercontent.com/SkyblockClient/SkyblockClient-REPO/main/files/" +
          hosting +
          "s/" +
          option.file,
    }
  );
};
