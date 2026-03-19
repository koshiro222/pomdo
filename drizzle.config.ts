import { defineConfig } from "drizzle-kit";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .dev.vars file manually for drizzle-kit
try {
  const devVarsPath = resolve(process.cwd(), ".dev.vars");
  const devVarsContent = readFileSync(devVarsPath, "utf-8");
  devVarsContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=");
    if (key && value) {
      process.env[key] = value;
    }
  });
} catch (e) {
  // .dev.vars doesn't exist or can't be read - rely on existing env vars
}

export default defineConfig({
  schema: "./functions/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
