import {
  FunctionFallback,
  createFunctionPrecondition,
} from "@sapphire/decorators";
import { BaseInteraction, Message } from "discord.js";
import { Servers } from "../const.js";

export function SkyClientOnly(
  fallback: FunctionFallback = (): void => undefined,
): MethodDecorator {
  return createFunctionPrecondition(
    (context: Message | BaseInteraction) =>
      context.guildId == Servers.SkyClient,
    fallback,
  );
}
