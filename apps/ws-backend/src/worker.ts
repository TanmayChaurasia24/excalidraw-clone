import { redis } from "@repo/redis";
import { prisma } from "@repo/database";

const SLEEP_MS = 1000;

async function processChatQueue() {
  console.log("processing chat queue...");

  while (true) {
    try {
      const messages = await redis.rpop("chat_messages", 50);

      if (!messages || messages.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, SLEEP_MS));
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
    }
  }
}

async function processCanvasQueue() {
  console.log("started canvas worker...");

  while (true) {
    try {
      const messages = await redis.rpop("canvas_elements", 50);

      if (!messages || messages.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, SLEEP_MS));
        continue;
      }
      console.log(`Pulled ${messages.length} canvas events from queue...`);
      const parsedMessages = messages.map((msg: string) => JSON.parse(msg));

      // if users moves one circle 10 times then we only want the 10th updated location of the circle
      const uniqueUpdates = new Map();
      for (const msg of parsedMessages) {
        uniqueUpdates.set(msg.element.id, msg);
      }

      const operations = Array.from(uniqueUpdates.values()).map((msg) => {
        const { roomId, userId, element } = msg;

        const propertiesToSave = {
          ...element.properties,
          ...(element.points ? { points: element.points } : {}),
        };

        return prisma.element.upsert({
          where: { id: element.id },
          update: {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            properties: propertiesToSave,
            zindex: element.zindex || 0,
          },
          create: {
            id: element.id,
            type: element.type,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            properties: propertiesToSave,
            zindex: element.zindex || 0,
            roomId,
            creatorId: userId,
          },
        });
      });

      await prisma.$transaction(operations);
      console.log(
        `Canvas batch upserted (${operations.length} unique writes).`,
      );
    } catch (error) {
      console.log("Canvas worker error: ", error);
    }
  }
}

const startWorkers = () => {
  console.log("Initializing background workers...");
  processChatQueue();
  processCanvasQueue();
};

startWorkers();
