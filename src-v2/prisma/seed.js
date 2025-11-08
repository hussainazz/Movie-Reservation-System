import { PrismaClient } from "./generated/client.js";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const __dirname = path.resolve();

const fileContent = fs
  .readFileSync(path.join(__dirname, "seedTables", "Movie.sql"), "utf-8")
  .split(";")
  .filter((sql) => sql.trim());

async function main() {
  try {
    for (let movie of fileContent) {
      await prisma.$executeRawUnsafe(movie);
    }
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
