import Redis from "ioredis";

const REDIS_URL =
  "redis://default:7ScibqTT2cNEVF5BPFpcIRnnppN8uXTg@redis-13166.crce276.ap-south-1-3.ec2.cloud.redislabs.com:13166";
console.log("redis url: ", REDIS_URL);

export const redis = new Redis(REDIS_URL, {
  family: 4,
});

export const pubClient = redis.duplicate();
export const subClient = redis.duplicate();

redis.on("connect", () => {
  console.log("✅ Successfully connected to Redis Cloud!");
});
pubClient.on("connect", () => {
  console.log("✅ Successfully connected to Redis Cloud!");
});
subClient.on("connect", () => {
  console.log("✅ Successfully connected to Redis Cloud!");
});
redis.on("error", (err) => {
  console.error("❌ Redis Cloud connection error:", err.message);
});
pubClient.on("error", (err) => {
  console.error("❌ Redis Cloud connection error:", err.message);
});
subClient.on("error", (err) => {
  console.error("❌ Redis Cloud connection error:", err.message);
});
