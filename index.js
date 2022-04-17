import tokens from "./config.json" assert { type: "json" };
import { ShardingManager } from "discord.js";
const manager = new ShardingManager("./bot.js", { token: tokens.botToken });
manager.on("shardCreate", (shard) => console.log(`Launched shard ${shard.id}`));
manager.spawn();
