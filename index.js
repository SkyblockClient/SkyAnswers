import { Client, Intents } from "discord.js";
import tokens from "./config.json" assert { type: "json" };
import {
  chatAskHelpCategory,
  chatAskIfCrashing,
  chatAskForFAQ,
  chatAskLauncherInfo,
  chatAskModInfo,
  chatFAQAnswer,
  chatIsFAQRelevant,
  chatNoRelevantFAQ,
  chatQuotaReached,
  chatReferToGuides,
  chatWelcome,
  collectActions,
  chatAskIfCrashpatch,
  chatAskUseSolution,
  chatAskForErrorCode,
  chatAskForLogs,
  chatAskWhenCrashing,
  chatAskThanos,
} from "./messages.js";
import fs from "fs/promises";
import fetch from "node-fetch";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
client.once("ready", () => console.log("Ready!"));

client.on("channelCreate", async (channel) => {
  if (!channel.name.startsWith("ticket-")) return;
  console.log(`Intercepted ticket: ${channel.name}`);
  const welcomeMsg = await chatWelcome(channel);
  const interactionWelcome = await collectActions(welcomeMsg, "BUTTON");
  if (interactionWelcome.customId == "yes") {
    await chatAskForFAQ(channel);
    const userQuestion = (await channel.awaitMessages({ max: 1 })).first();
    const currentQuota = await fs.readFile("quota.json", "utf8");
    const quota = JSON.parse(currentQuota);
    const todayKey = Math.floor(
      new Date().getTime() / (1000 * 60 * 60 * 24)
    ).toString();
    console.log(`Quota for ${todayKey} is ${quota[todayKey]}`);
    if (userQuestion.content.toLowerCase() == "skip") {
      channel.send("Got it, let's go to the next steps.");
    } else if (quota[todayKey] > 5000 / 31) {
      await chatQuotaReached(channel);
    } else {
      quota[todayKey] = (quota[todayKey] || 0) + 1;
      await fs.writeFile("quota.json", JSON.stringify(quota));
      channel.send("Got it, checking...");
      const faqAnswer = await fetch(
        "https://centralus.api.cognitive.microsoft.com/language/:query-knowledgebases?" +
          new URLSearchParams({
            projectName: "SkyclientAnswers",
            "api-version": "2021-10-01",
            deploymentName: "production",
          }),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": tokens.qaToken,
          },
          body: JSON.stringify({
            top: 1,
            question: userQuestion.content,
            confidenceScoreThreshold: 0.2,
          }),
        }
      );
      const faqAnswerJson = await faqAnswer.json();
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
      if (!faqAnswerJson.answers[0].questions) {
        await chatNoRelevantFAQ(
          channel,
          "Sorry, we couldn't find any relevant FAQ for your question."
        );
      } else {
        const suggestedQuestion = faqAnswerJson.answers[0].questions[0];
        const suggestedAnswer = faqAnswerJson.answers[0].answer;
        const suggestedQuestionMsg = await chatIsFAQRelevant(
          channel,
          suggestedQuestion
        );
        const interactionIsRelevant = await collectActions(
          suggestedQuestionMsg,
          "BUTTON"
        );
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
    const helpCategoryMsg = await chatAskHelpCategory(channel);
    const interactionHelpCategory = await collectActions(
      helpCategoryMsg,
      "SELECT_MENU"
    );
    const categorySelection = interactionHelpCategory.values[0];
    if (categorySelection == "stopping") {
      const isCrashingMsg = await chatAskIfCrashing(channel);
      const interactionIsCrashing = await collectActions(isCrashingMsg, "BUTTON");
      if (interactionIsCrashing.customId == "yes") {
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
            channel.send(
              "There's no suggested solution? That's sad. Okay, let's proceed."
            );
          }
        } else if (interactionIsCrashing.customId == "no") {
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
      }
    } else if (categorySelection == "setup") {
      await chatAskLauncherInfo(channel);
    } else if (categorySelection == "modError") {
      await chatAskModInfo(channel);
    } else if (categorySelection == "modHelp") {
      await chatReferToGuides(channel);
    }
    channel.send(
      "Anyway, I don't have anything else planned. " +
        "Let's wait for a human to get here. " +
        "Don't forget to state your problem clearly."
    );
  } else {
    channel.send("Ok, bye!");
  }
});

console.log("Logging in...");
client.login(tokens.botToken);
