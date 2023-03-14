export const command = async ({ client, respond, guild }) => {
  const isInTrusted =
    guild.id == "780181693100982273" ||
    (guild.id == "962319226377474078" && client.user.id == "977585995174252624");
  await respond({
    content:
      "Current handlers:\n" +
      client.handlers
        .map((handler) => {
          if (!handler.when.public && !isInTrusted) return;
          if (handler.when.starts) {
            if (handler.when.input)
              return `- \`${handler.when.starts[0]} [input]\`: ${handler.when.desc}`;
            else return `- \`${handler.when.starts.join(" or ")}\`: ${handler.when.desc}`;
          }
          if (handler.when.slash)
            if (handler.when.slash.data.type == 2 || handler.when.slash.data.type == 3)
              return `- context menu: ${handler.when.slash.data.name}`;
            else
              return `- \`/${handler.when.slash.data.name}\`: ${handler.when.slash.data.description}`;
          if (handler.when.all) {
            return `- ${handler.when.all}: ${handler.when.desc}`;
          }
        })
        .filter((handler) => handler)
        .sort()
        .join("\n") +
      (isInTrusted
        ? ""
        : `
Note that this is only the handlers okay for public use.`),
  });
};
export const when = {
  starts: ["sky help", "<@962316410070130688>"],
  desc: "Displays this",
  input: false,
  public: true,
};
