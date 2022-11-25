export const command = async ({ content, respond }) => {
  const date = new Date();
  if (
    content.includes("<@794377681331945524>") &&
    date.getUTCHours() >= 4 &&
    date.getUTCHours() < 14
  ) {
    await respond({
      content:
        "kti is probably away from their computer for the night (8PM-6AM my time, <t:14400:t>-<t:50400:t> your time)",
    });
  }
};
export const when = {
  all: "messages",
  desc: "Replies to when kti is mentioned when they're probably asleep",
};
