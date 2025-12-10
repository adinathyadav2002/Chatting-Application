import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/index.js";

const adapter = new PrismaMariaDb({
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "chat_app",
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

export { prisma };
