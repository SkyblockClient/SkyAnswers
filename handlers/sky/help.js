export const command = async ({ client, respond }) => {
  await respond({
    content:
      "Current handlers:\n" +
      client.handlers
        .map((handler) => {
          if (handler.when.starts) {
            if (handler.when.input)
              return `- \`${handler.when.starts[0]} [input]\`: ${handler.when.desc}`;
            else return `- \`${handler.when.starts.join(" or ")}\`: ${handler.when.desc}`;
          }
          if (handler.when.all) {
            return `- all new ${handler.when.all}: ${handler.when.desc}`;
          }
        })
        .filter((handler) => handler)
        .sort()
        .join("\n"),
  });
};
export const when = {
  starts: ["sky help", "<@962316410070130688>"],
  desc: "Displays this",
  input: false,
};
