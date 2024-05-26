import { Events, Listener } from "@sapphire/framework";
import { type Client, type PresenceStatusData } from "discord.js";
import { ApplyOptions } from "@sapphire/decorators";
import { Time } from "@sapphire/time-utilities";

@ApplyOptions<Listener.Options>({
  once: true,
  event: Events.ClientReady,
})
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  public override run(client: Client) {
    client.user?.setPresence({ activities: [] });

    setInterval(() => {
      const statuses: PresenceStatusData[] = ["online", "idle", "dnd"];
      const index = Math.floor(Math.random() * statuses.length);
      client.user?.setStatus(statuses[index]);
    }, Time.Second * 3);
  }
}
