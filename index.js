import { Client, Intents } from "discord.js";
import tokens from "./config.json" assert { type: "json" };
import {
  chatAskForFAQ,
  chatFAQAnswer,
  chatIsFAQRelevant,
  chatNoRelevantFAQ,
  chatQuotaReached,
  chatWelcome,
  collectActions,
} from "./messages.js";
import fs from "fs/promises";
import fetch from "node-fetch";

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
    if (quota[todayKey] > 5000 / 31) {
      await chatQuotaReached(channel);
    } else {
      quota[todayKey] = (quota[todayKey] || 0) + 1;
      await fs.writeFile("quota.json", JSON.stringify(quota));
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
            answer: "View the downloads at https://ktibow.github.io/Skyclient/ or in .",
            confidenceScore: 0.5277000000000001,
            id: 194,
            source: "scfaq.txt",
            metadata: { system_metadata_qna_edited_manually: "true" },
            dialog: { isContextOnly: false, prompts: [] },
          },
        ],
      };
      */
      if (faqAnswerJson.answers.length == 0) {
        await chatNoRelevantFAQ(channel);
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
            await chatNoRelevantFAQ(channel);
          }
        } else {
          await chatNoRelevantFAQ(channel);
        }
      }
    }
    channel.send(`From here I would proceed with this chart:
https://cdn.discordapp.com/attachments/780181693553704973/962766715798822983/procedure.dot.png
However, I haven't implemented that yet lol`);
  } else {
    channel.send("Ok, bye!");
  }
});

console.log("Logging in...");
client.login(tokens.botToken);
