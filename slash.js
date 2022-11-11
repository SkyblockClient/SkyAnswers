import { REST, Routes } from "discord.js";
import { promise } from "glob-promise";
import "dotenv/config";

const token = process.env.BOT_TOKEN;
const api = new REST({ version: "10" }).setToken(token);
const loadHandlers = async () => {
  const handlerPaths = await promise("./handlers/**/*.js");
  return await Promise.all(handlerPaths.map((path) => import(path)));
};
const registerCommands = async (body) =>
  api.put(Routes.applicationGuildCommands(atob(token.split(".")[0])), {
    body,
  });

const handlers = await loadHandlers();
const slashCommands = handlers.filter((handler) => handler.when.slash);
const resp = await registerCommands(slashCommands.map((handler) => handler.when.slash.data));
console.log(resp);
