import { Events, Listener } from "@sapphire/framework";
import { type Client, type PresenceStatusData } from "discord.js";
import { ApplyOptions } from "@sapphire/decorators";
import { Time } from "@sapphire/time-utilities";
import { pickRandom } from "@sapphire/utilities";

@ApplyOptions<Listener.Options>({
  once: true,
  event: Events.ClientReady,
})
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  public override run(client: Client) {
    client.user?.setPresence({ activities: [] });
    let status: PresenceStatusData = "online";

    setInterval(() => {
      status = pickRandom(
        (["online", "idle", "dnd"] as PresenceStatusData[]).filter(
          (v) => v != status,
        ),
      );
      client.user?.setStatus(status);
    }, Time.Second * 3);
  }
}
