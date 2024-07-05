import { Events, Listener, container } from "@sapphire/framework";
import { Colors, DiscordAPIError, roleMention } from "discord.js";
import { ApplyOptions } from "@sapphire/decorators";
import { SkyClient, Polyfrost, DevServer, Users } from "../../const.js";
import { TextChannel } from "discord.js";
import {
  getTicketOwner,
  getTicketTop,
  isBumpMessage,
  isTicket,
} from "../../lib/ticket.js";
import { Duration, Time } from "@sapphire/time-utilities";
import { Stopwatch } from "@sapphire/stopwatch";
import pMap from "p-map";

const SupportTeams: Record<string, string> = {
  [SkyClient.id]: SkyClient.roles.SupportTeam,
  [Polyfrost.id]: Polyfrost.roles.SupportTeam,
  [DevServer.id]: DevServer.roles.SupportTeam,
};

@ApplyOptions<Listener.Options>({
  once: true,
  event: Events.ClientReady,
})
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  public override async run() {
    const tickets = getTickets();

    const stopwatch = new Stopwatch();
    // We want the bot to prefetch and cache ticket information.
    await pMap(tickets, getTicketOwner);
    container.logger.info(
      `Pre-cached ${tickets.length} tickets.`,
      `Took ${stopwatch.stop().toString()}`,
    );

    await pMap(getTickets(), pinTop);
    setInterval(
      () => void pMap(getTickets(), maintain, { concurrency: 3 }),
      Time.Second * 30,
    );
    await pMap(getTickets(), expireBumps, { concurrency: 3 });
  }
}

const getTickets = () =>
  Array.from(container.client.channels.cache.values()).filter(isTicket);

async function maintain(ticket: TextChannel) {
  try {
    const support = SupportTeams[ticket.guildId];
    if (!support) return;

    const messages = await ticket.messages.fetch();
    const lastMsg = messages
      .filter((message) => message.author.id != Users.TicketTool)
      .first();
    if (!lastMsg) return;
    if (
      lastMsg.author.id == ticket.client.user.id &&
      lastMsg.content.startsWith(roleMention(support))
    )
      return;

    const ownerId = await getTicketOwner(ticket);
    if (ownerId) {
      const owner = ticket.guild.members.resolve(ownerId);
      if (!owner) return void pingStaff(ticket, "owner left");
    }

    if (isBumpMessage(lastMsg)) {
      const twoDays = new Duration("2d").dateFrom(lastMsg.createdAt);
      if (twoDays < new Date()) return void pingStaff(ticket, "time to close");
    }
  } catch (e) {
    const header = `Failed to maintain ticket in ${ticket.name} in ${ticket.guild.name}:`;
    if (e instanceof DiscordAPIError) {
      if (e.code == 50001) return;
      container.logger.error(header, e.code, e.message);
    } else if (e instanceof Error && e.name == "ConnectTimeoutError") {
      container.logger.error(header, "Connect Timeout Error");
    } else container.logger.error(header, e);
  }
}

export async function expireBumps(ticket: TextChannel) {
  try {
    const support = SupportTeams[ticket.guildId];
    if (!support) return;

    const messages = await ticket.messages.fetch();
    const lastMsg = messages
      .filter((message) => message.author.id != Users.TicketTool)
      .filter(
        (message) =>
          !(
            message.author.id == ticket.client.user.id &&
            message.content.startsWith(roleMention(support))
          ),
      )
      .first();
    const bumps = messages.filter(isBumpMessage);
    if (!lastMsg) return;

    for (const bump of bumps.values()) {
      if (lastMsg.id == bump.id) continue;

      await bump.edit({
        content: "",
        embeds: [
          {
            title: "Bump Expired",
            color: Colors.Red,
          },
        ],
        // components: [buildDeleteBtnRow()],
      });
    }
  } catch {
    /* empty */
  }
}

export async function pinTop(ticket: TextChannel) {
  try {
    if (ticket.lastPinAt) return;
    const top = await getTicketTop(ticket);
    if (!top || top.pinned) return;
    await top.pin();
  } catch (e) {
    const header = `Failed to pin ticket top in ${ticket.name} in ${ticket.guild.name}:`;
    if (e instanceof DiscordAPIError) {
      if (e.code == 50001) return;
      container.logger.error(header, e.code, e.message);
    } else if (e instanceof Error && e.name == "ConnectTimeoutError") {
      container.logger.error(header, "Connect Timeout Error");
    } else container.logger.error(header, e);
  }
}

const pingStaff = async (channel: TextChannel, msg: string) => {
  const support = SupportTeams[channel.guildId];
  if (!support) return;
  return channel.send(`${roleMention(support)} ${msg}`);
};
