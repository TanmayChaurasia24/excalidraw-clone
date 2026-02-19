import { redis } from "@repo/redis";
import { prisma } from "@repo/database";

async function processChatQueue() {
  console.log("processing chat queue...");

  while (true) {
    try {
      const messages = await redis.rpop("chat_messages", 50);

      if (!messages || messages.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        continue;
      }

      console.log(`Processing ${messages.length} messages...`);

      const dataToStore = messages.map((msg) => JSON.parse(msg));

      await prisma.chat.createMany({
        data: dataToStore,
      });
      console.log("Batch inserted successfully.");
    } catch (error) {
      console.log("worker error: ", error);
      return;
    }
  }
}

processChatQueue();
