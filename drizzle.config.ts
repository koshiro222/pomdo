import { defineConfig } from "drizzle-kit";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// drizzle-kit 用に .dev.vars を読み込む。
try {
  const devVarsPath = resolve(process.cwd(), ".dev.vars");
  const devVarsContent = readFileSync(devVarsPath, "utf-8");
  devVarsContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=");
    if (key && value) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch {
  // .dev.vars がなければ既存の環境変数を使う。
}

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  throw new Error('DATABASE_URL が未設定です。対象環境のデータベース接続先を設定してください。')
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
