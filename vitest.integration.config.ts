import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

process.env.RUN_DB_TESTS = "1";

export default mergeConfig(baseConfig, defineConfig({
  test: {
    include: ["tests/core.integration.test.ts"],
    fileParallelism: false
  }
}));
