import { Client, Intents } from "discord.js";
import fs from "fs/promises";
import fetch from "node-fetch";
import {
  chatAskForErrorCode,
  chatAskForFAQ,
  chatAskForLogs,
  chatAskHelpCategory,
  chatAskIfCrashing,
  chatAskIfCrashpatch,
  chatAskLauncherInfo,
  chatAskModInfo,
  chatAskThanos,
  chatAskUseSolution,
  chatAskWhenCrashing,
  chatFAQAnswer,
  chatIsFAQRelevant,
  chatNoRelevantFAQ,
  chatQuotaReached,
  chatReferToGuides,
  chatWelcome,
  collectActions,
} from "./messages.js";

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_PRESENCES,
  ],
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
client.once("ready", () => console.log("Ready!"));
client.on("error", (e) => console.error("Error:", e));
client.on("warning", (e) => console.warn("Warning:", e));
client.on("debug", (e) => console.info("Debug: ", e));
client.on("unhandledRejection", (error) => console.error("Promise rejection:", error));
client.on("guildMemberUpdate", async (oldUser, newUser) => {
  console.log("got an update", newUser);
  if (newUser.id != "794377681331945524") return;
  if (newUser.nickname != "n a c r t") {
    await newUser.send("Your nickname is not set to `n a c r t`.");
    const fetchedLogs = await client.guilds.cache.get("780181693100982273").fetchAuditLogs({
      limit: 1,
      type: "MEMBER_UPDATE",
    });
    const lastLog = fetchedLogs.entries.first();
    if (lastLog.target.id == newUser.id) {
      lastLog.executor.send("bruh why you rename kti");
    }
  }
});
client.on("messageCreate", async (message) => {
  const content = message.content.toLowerCase();
  if (
    content.includes("skyanswers") &&
    content.includes("please") &&
    content.includes("ping") &&
    content.includes("rayless")
  ) {
    client.guilds.cache
      .get("780181693100982273")
      .channels.cache.get("887818760126345246")
      .send("<@635899044740333579> " + (content.split("|")[1] || " "));
  }
});
client.on("channelCreate", async (channel) => {
  if (!channel.name.startsWith("ticket-")) return;
  console.log(`Intercepted ticket: ${channel.name}`);
  await delay(500);
  const welcomeMsg = await chatWelcome(channel);
  const interactionWelcome = await collectActions(welcomeMsg, "BUTTON");
  if (interactionWelcome.customId != "yes") return;

  await chatAskForFAQ(channel);
  const userQuestion = (await channel.awaitMessages({ max: 1 })).first().content;
  let quota;
  try {
    const currentQuota = await fs.readFile("quota.json", "utf8");
    quota = JSON.parse(currentQuota);
  } catch (e) {
    quota = {};
  }
  const todayKey = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)).toString();

  console.log(`Quota for ${todayKey} is ${quota[todayKey]}`);
  if (userQuestion.toLowerCase() == "skip") {
    channel.send("Got it, let's move on to the solving process.");
  } else if (quota[todayKey] > 5000 / 31) {
    await chatQuotaReached(channel);
  } else {
    quota[todayKey] = (quota[todayKey] || 0) + 1;
    await fs.writeFile("quota.json", JSON.stringify(quota));
    channel.send("Got it, checking...");
    let faqAnswer, faqAnswerJson;
    try {
      faqAnswer = await fetch(
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
            question: userQuestion,
            confidenceScoreThreshold: 0.3,
          }),
        }
      );
      faqAnswerJson = await faqAnswer.json();
      if (faqAnswerJson.answers.length == 0) {
        throw new Error(faqAnswerJson);
      }
    } catch (e) {
      channel.send("Something went wrong inside of SkyAnswers. Oops!");
      console.log(faqAnswer);
      console.error(e);
    }
    /*
        const faqAnswerJson = {
          answers: [
            {
              questions: ["How can I download SkyClient?", "Where do I get SkyClient?"],
              answer: "View the downloads at https://ktibow.github.io/Skyclient/ or in <#780940408175853609>.",
              confidenceScore: 0.5277000000000001,
              id: 194,
              source: "scfaq.txt",
              metadata: { system_metadata_qna_edited_manually: "true" },
              dialog: { isContextOnly: false, prompts: [] },
            },
          ],
        };
        */
    if (faqAnswerJson.answers[0].answer == "No idea ¯\\_(ツ)_/¯") {
      if (!userQuestion.toLowerCase().includes("crash")) {
        await chatNoRelevantFAQ(channel, "Sorry, we couldn't find any relevant FAQ.");
      }
    } else {
      const suggestedQuestion = faqAnswerJson.answers[0].questions[0];
      const suggestedAnswer = faqAnswerJson.answers[0].answer;
      const suggestedQuestionMsg = await chatIsFAQRelevant(channel, suggestedQuestion);
      const interactionIsRelevant = await collectActions(suggestedQuestionMsg, "BUTTON");
      if (interactionIsRelevant.customId == "yes") {
        const suggestedAnswerMsg = await chatFAQAnswer(channel, suggestedAnswer);
        const interactionWorks = await collectActions(suggestedAnswerMsg, "BUTTON");
        if (interactionWorks.customId == "yes") {
          channel.send("Great! Consider closing this ticket now.");
          return;
        } else {
          await chatNoRelevantFAQ(channel, "Sorry that didn't work.");
        }
      } else {
        await chatNoRelevantFAQ(channel, "Sorry that FAQ wasn't relevant.");
      }
    }
  }
  const crashWorkflow = async () => {
    const crashpatchMsg = await chatAskIfCrashpatch(channel);
    const interactionCrashpatch = await collectActions(crashpatchMsg, "BUTTON");
    if (interactionCrashpatch.customId == "yes") {
      const useSolutionMsg = await chatAskUseSolution(channel);
      const interactionUseSolution = await collectActions(useSolutionMsg, "BUTTON");
      if (interactionUseSolution.customId == "yesDone") {
        channel.send("Great! Consider closing this ticket now.");
        return;
      } else if (interactionUseSolution.customId == "yesNotDone") {
        channel.send("It doesn't work? That's sad. Okay, let's proceed.");
      } else if (interactionUseSolution.customId == "no") {
        channel.send("There's no suggested solution? That's sad. Okay, let's proceed.");
      }
    } else if (interactionCrashpatch.customId == "no") {
      await chatAskForErrorCode(channel);
      await delay(15000);
    }
    await chatAskForLogs(channel);
    await delay(15000);
    const whenCrashingMsg = await chatAskWhenCrashing(channel);
    const interactionWhenCrashing = await collectActions(whenCrashingMsg, "BUTTON");
    channel.send(
      {
        launch: "So you crashed when you launched Minecraft? Huh.",
        login: "So you crashed when you joined Hypixel? Huh.",
        other: "So you crashed when you did something else? Huh.",
      }[interactionWhenCrashing.customId]
    );
    await chatAskThanos(channel);
  };
  switch (userQuestion.toLowerCase().includes("crash")) {
    case true:
      await channel.send("Given that you mentioned crashing:");
      const isCrashingMsg = await chatAskIfCrashing(channel);
      const interactionIsCrashing = await collectActions(isCrashingMsg, "BUTTON");
      if (interactionIsCrashing.customId == "yes") {
        await crashWorkflow();
        break;
      }
    case false:
      const helpCategoryMsg = await chatAskHelpCategory(channel);
      const interactionHelpCategory = await collectActions(helpCategoryMsg, "SELECT_MENU");
      const categorySelection = interactionHelpCategory.values[0];
      if (categorySelection == "stopping") {
        const isCrashingMsg = await chatAskIfCrashing(channel);
        const interactionIsCrashing = await collectActions(isCrashingMsg, "BUTTON");
        if (interactionIsCrashing.customId == "yes") {
          await crashWorkflow();
        }
      } else if (categorySelection == "setup") {
        await chatAskLauncherInfo(channel);
      } else if (categorySelection == "modError") {
        await chatAskModInfo(channel);
      } else if (categorySelection == "modHelp") {
        await chatReferToGuides(channel);
      }
  }
  channel.send(
    "Anyway, I don't have anything else planned. " +
      "Let's wait for a human to get here. " +
      "Don't forget to state your problem clearly."
  );
});
console.log("loaded");
client.login();
