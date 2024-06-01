import { db } from "./recorder.js";
import { createCanvas } from "canvas";
import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Legend,
  Title,
} from "chart.js";

Chart.register(
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Legend,
  Title
);
/**
 * @param {import("../../bot.js").MessageData} message
 * @param {string} query
 */
export const command = async ({ respond, channel }, query) => {
  if (!db) throw "no db hooked up";
  const user = query.match(/[0-9]+/)[0];
  if (!user) throw "no user specified";
  channel.sendTyping();

  const { data, error } = await db.rpc("get_message_times", {
    author_to_use: user,
  });
  if (error) throw error;
  const allStatuses = ["online", "dnd", "idle", "offline", null].filter(
    (status) => data.some((group) => group.status === status)
  );
  const silentTimes = Array.from({ length: 24 }, (v, i) => i).filter((hour) =>
    data.every((group) => group.date_part != hour || group.count < 5)
  );

  const graphSpace = createCanvas(1920, 1080);
  const bgPlugin = {
    id: "custom_canvas_background_color",
    beforeDraw: (chart) => {
      const ctx = chart.canvas.getContext("2d");
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#2e3440";
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };
  Chart.defaults.color = "white";
  Chart.defaults.font.family = "system-ui, Roboto, sans-serif";
  Chart.defaults.font.size = 27;

  // @ts-ignore
  const chart = new Chart(graphSpace, {
    type: "bar",
    data: {
      labels: Array.from({ length: 24 }, (v, i) => i),
      datasets: allStatuses.map((status) => ({
        label: status,
        data: Array.from(
          { length: 24 },
          (v, i) =>
            data.find((group) => group.status === status && group.date_part === i)
              ?.count || 0
        ),
        backgroundColor:
          status === "dnd"
            ? "#bf616a"
            : status === "online"
            ? "#a3be8c"
            : status === "idle"
            ? "#ebcb8b"
            : status === "offline"
            ? "#434c5e"
            : "#b48ead",
      })),
    },
    options: {
      scales: {
        x: {
          stacked: true,
          grid: {
            color: "#3b4252",
            lineWidth: 4,
          },
        },
        y: {
          stacked: true,
          grid: {
            color: "#3b4252",
            lineWidth: 4,
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: `messages / hour (utc)`,
        },
      },
    },
    plugins: [bgPlugin],
  });
  const buffer = graphSpace.toBuffer("image/png");
  await respond({
    content: `<@${user}> is barely online at ${silentTimes
      .map((time) => `<t:${time * 60 * 60}:t>`)
      .join(", ")}`,
    files: [
      {
        attachment: buffer,
        name: "messageTimes.png",
        contentType: "image/png",
      },
    ],
    allowedMentions: { parse: [] },
  });
};
export const when = {
  starts: ["sky online"],
  input: true,
  desc: "Gives you a graph of when someone's online",
};
