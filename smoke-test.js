import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const inputPdf = process.argv[2];

  if (!inputPdf) {
    console.error("Usage: npm run smoke:test -- /absolute/or/relative/path/to/file.pdf");
    process.exit(1);
  }

  const resolvedPdf = path.resolve(inputPdf);
  const serverPath = path.resolve("./server.js");
  const outputDir = await mkdtemp(path.join(os.tmpdir(), "mcp-pdf-to-png-"));
  const outputPrefix = "smoke";

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath]
  });

  const client = new Client({
    name: "pdf-to-png-smoke-test",
    version: "1.0.0"
  });

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: "pdf_to_png",
      arguments: {
        inputPdf: resolvedPdf,
        outputDir,
        outputPrefix,
        firstPage: 1,
        lastPage: 1,
        dpi: 96
      }
    });

    const files = await readdir(outputDir);
    const pngFiles = files.filter((file) => file.startsWith(`${outputPrefix}-`) && file.endsWith(".png"));

    if (pngFiles.length === 0) {
      throw new Error(`Tool call succeeded but no PNG files were created in ${outputDir}`);
    }

    console.log("Smoke test passed");
    console.log(`Input PDF: ${resolvedPdf}`);
    console.log(`Output dir: ${outputDir}`);
    console.log(`PNG files: ${pngFiles.join(", ")}`);
    console.log(`MCP result: ${JSON.stringify(result, null, 2)}`);
  } finally {
    await client.close();
    // await rm(outputDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
