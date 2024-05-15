/**
 * @param {import("../../bot.js").MessageData} message
 */
export const command = async (message) => {
  await message.react("green_check:796548440266899526");
};
export const when = {
  starts: ["fire ban"],
  desc: "reacts with check bc funny",
  input: true,
};
