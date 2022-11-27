import { createClient } from "@supabase/supabase-js";
export const db =
  process.env.SB_KEY &&
  createClient("https://fkjmuugisxgmrklcfyaj.supabase.co", process.env.SB_KEY);

export const command = async (message) => {
  if (db) {
    const { error } = await db.from("messages").insert({
      id: message.id,
      time: new Date(message.createdTimestamp),
      status: message.member.presence?.status,
      author: message.member.id,
    });
    if (error) throw error;
  } else {
    console.warn("you should set up the db");
  }
};
export const when = {
  all: "messages",
  desc: "Notes message times to figure out when people are online",
};
