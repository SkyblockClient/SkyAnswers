import { REST, Routes } from "discord.js";
import { promise } from "glob-promise";
import "dotenv/config";

const token = process.env.BOT_TOKEN;
const guild = null;
const commandEndpoint = guild
  ? Routes.applicationGuildCommands(atob(token.split(".")[0]), guild)
  : Routes.applicationCommands(atob(token.split(".")[0]));
const api = new REST({ version: "10" }).setToken(token);
const loadHandlers = async () => {
  const handlerPaths = await promise("./handlers/**/*.js");
  return await Promise.all(handlerPaths.map((path) => import(path)));
};
const registerCommands = (body) => {
  return api.put(commandEndpoint, {
    body,
  });
};

const deleteAll = false;
if (deleteAll) {
  const allCommands = await api.get(commandEndpoint);
  console.log(allCommands);
  console.log(
    await Promise.all(allCommands.map((command) => api.delete(commandEndpoint + "/" + command.id)))
  );
}
const handlers = await loadHandlers();
const slashCommands = handlers.filter((handler) => handler.when.slash);
const resp = await registerCommands(slashCommands.map((handler) => handler.when.slash.data));
console.log(resp);
