import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/index.js";

const databaseUrl = process.env.DATABASE_URL;

let adapterConfig;
if (databaseUrl) {
  const parsed = new URL(databaseUrl);
  adapterConfig = {
    host: parsed.hostname || "localhost",
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username || "root"),
    password: decodeURIComponent(parsed.password || ""),
    database: parsed.pathname ? parsed.pathname.replace(/^\//, "") : "chat_app",
    allowPublicKeyRetrieval: true,
    connectionLimit: 5,
  };
} else {
  adapterConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "chat_app",
    allowPublicKeyRetrieval: true,
    connectionLimit: 5,
  };
}

const adapter = new PrismaMariaDb(adapterConfig);
const prisma = new PrismaClient({ adapter });

export { prisma };
