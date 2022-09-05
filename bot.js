import { execFile } from "child_process";
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
import { fileURLToPath } from "url";

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
const modsResp = await fetch(
  "https://raw.githubusercontent.com/nacrt/SkyblockClient-REPO/main/files/mods.json"
);
const mods = await modsResp.json();
const modsInSkyclient = mods
  .filter((mod) => {
    if (!mod.forge_id) return false;
    if (mod.hidden && !mods.some((otherMod) => otherMod.packages?.includes(mod.id))) return false;
    return true;
  })
  .map((mod) => mod.forge_id);
await fs.writeFile("mods_in_skyclient.txt", modsInSkyclient.join("\n"));
const crashResp = await fetch(
  "https://raw.githubusercontent.com/SkyblockClient/CrashData/main/crashes.json"
);
await fs.writeFile("crash_data.json", await crashResp.text());

client.once("ready", () => console.log("Ready!"));
client.on("error", (e) => console.error("Error:", e));
client.on("warning", (e) => console.warn("Warning:", e));
client.on("debug", (e) => console.info("Debug: ", e));
client.on("unhandledRejection", (error) => console.error("Promise rejection:", error));

client.on("guildMemberUpdate", async (oldUser, newUser) => {
  console.log(newUser.user.tag, "was updated");
  if (newUser.id != "794377681331945524") return;
  const fetchedLogs = await newUser.guild.fetchAuditLogs({
    limit: 1,
    type: "MEMBER_UPDATE",
  });
  const lastLog = fetchedLogs.entries.first();
  if (lastLog.target.id == newUser.id) {
    await newUser.send(`<@${lastLog.executor.id}> updated you. Changes:
\`\`\`
${JSON.stringify(lastLog.changes, null, 2)}
\`\`\``);
  } else {
    await newUser.send(`You were updated, but the audit log was for <@${lastLog.target.id}>.`);
  }
});
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const content = message.content.toLowerCase();
  if (
    content.includes("skyanswers") &&
    content.includes("please") &&
    content.includes("ping") &&
    content.includes("rayless")
  ) {
    message.channel.send("<@635899044740333579> " + (content.split("|")[1] || " "));
  }
  if (message.author.id == "573176011416666132" && content.includes("ratio")) {
    message.reply("no u ratio-er");
  }
  const date = new Date();
  if (
    content.includes("<@794377681331945524>") &&
    date.getUTCHours() >= 3 &&
    date.getUTCHours() < 13
  ) {
    message.reply(
      "kti is probably away from their computer for the night (8PM-6AM my time, <t:14400:t>-<t:50400:t> your time)"
    );
  }

  for (const attachment of message.attachments.values()) {
    if (!attachment.name.endsWith(".txt") && !attachment.name.endsWith(".log")) continue;
    let isDefinitelyLog =
      /crash.+-client\.txt/.test(attachment.name) || attachment.name.endsWith(".log");
    if (isDefinitelyLog) {
      await message.channel.sendTyping();
    }
    const log = await fetch(attachment.url);
    const logText = await log.text();
    processLog(logText, message.channel, isDefinitelyLog);
  }
  const hastebinRegex = /https:\/\/hst\.sh\/([a-z]*)/;
  const hastebinMatch = content.match(hastebinRegex);
  if (hastebinMatch) {
    const log = await fetch(`https://hst.sh/raw/${hastebinMatch[1]}`);
    const logText = await log.text();
    processLog(logText, message.channel);
  }
});

client.on("channelCreate", async (channel) => {
  if (!channel.name.startsWith("ticket-")) return;
  console.log(`Intercepted ticket: ${channel.name}`);
  await delay(500);
  const welcomeMsg = await chatWelcome(channel);
  const interactionWelcome = await collectActions(welcomeMsg, "BUTTON", true);
  if (interactionWelcome.customId == "yes") {
    await supportWorkflow(channel);
  }
});

const processLog = async (logText, channel, alreadyTyping = false) => {
  if (
    ![
      "Thank you for using SkyClient",
      "This is the output Console and will display information important to the developer!",
      "Error sending WebRequest",
      "The game crashed whilst",
      "net.minecraft.launchwrapper.Launch",
      "# A fatal error has been detected by the Java Runtime Environment:",
      "---- Minecraft Crash Report ----",
      "A detailed walkthrough of the error",
      "launchermeta.mojang.com",
      "Running launcher core",
      "Native Launcher Version:",
      "[Client thread/INFO]: Setting user:",
      "[Client thread/INFO]: (Session ID is",
      "MojangTricksIntelDriversForPerformance",
      "[DefaultDispatcher-worker-1] INFO Installer",
      "[DefaultDispatcher-worker-1] ERROR Installer",
      "net.minecraftforge",
      "club.sk1er",
      "gg.essential",
      "View crash report",
    ].some((x) => logText.includes(x))
  )
    return;
  if (!alreadyTyping) channel.sendTyping();
  const logFile = `/tmp/log${Date.now()}.txt`;
  await fs.writeFile(logFile, logText.replace(/\r/g, ""));
  const embedContent = await new Promise((resolve) => {
    const pathToLogParser = fileURLToPath(import.meta.url).replace(
      "bot.js",
      process.env.NODE_ENV == "production" ? "log_parser_docker" : "log_parser"
    );
    execFile(pathToLogParser, [logFile], (error, stdout, stderr) => {
      console.log("Parsed log!", stdout);
      if (error || stderr) console.log("Errors!", error, stderr);
      resolve(stdout);
    });
  });
  await channel.send({
    embeds: [
      {
        title: logText.startsWith("---- Minecraft Crash Report ----")
          ? "Crash report analysis"
          : logText.includes("---- Minecraft Crash Report ----")
          ? "Log with embedded report analysis"
          : "Log analysis",
        description: embedContent,
        color: 0xff8844,
      },
    ],
  });
};
const supportWorkflow = async (channel) => {
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
  } else if (!userQuestion) {
    channel.send("You didn't send a text response. Anyway, let's move on.");
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
        launch: "They said they crashed on launch.",
        login: "They said they crashed when they joined Hypixel.",
        other: "They said they crashed when they did something else.",
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
};
console.log("loaded", import.meta.url);
client.login();
