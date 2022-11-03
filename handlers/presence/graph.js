import { db } from "./recorder.js";

export const command = async ({ respond }, query) => {
  if (!db) throw "no db hooked up";
  const user = query.match(/[0-9]+/)[0];
  if (!user) throw "no user specified";
  throw "this is still wip";
  const { data, error } = await db.from("messages").select("time, status").eq("author", user);
  if (error) throw error;
  console.log(data);
};
export const when = {
  starts: ["sky online"],
  input: true,
  desc: "Gives you a graph of when someone's online",
};
