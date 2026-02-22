import { spawn } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "pdf-to-png-converter",
  version: "1.0.0"
});

server.tool(
  "pdf_to_png",
  "Convert one or more PDF pages to PNG files using pdftoppm",
  {
    inputPdf: z.string().min(1).describe("Absolute or relative path to the input PDF file"),
    outputDir: z.string().min(1).describe("Directory where PNG files will be written"),
    outputPrefix: z.string().default("page").describe("File prefix for output images"),
    firstPage: z.number().int().positive().optional().describe("First page to convert (1-based)"),
    lastPage: z.number().int().positive().optional().describe("Last page to convert (1-based)"),
    dpi: z.number().int().positive().default(150).describe("Output DPI")
  },
  async ({ inputPdf, outputDir, outputPrefix, firstPage, lastPage, dpi }) => {
    const resolvedInput = path.resolve(inputPdf);
    const resolvedOutputDir = path.resolve(outputDir);

    if (firstPage !== undefined && lastPage !== undefined && firstPage > lastPage) {
      throw new Error("firstPage cannot be greater than lastPage");
    }

    await access(resolvedInput);
    await mkdir(resolvedOutputDir, { recursive: true });

    const outputBase = path.join(resolvedOutputDir, outputPrefix);

    const args = ["-png", "-r", String(dpi)];

    if (firstPage !== undefined) {
      args.push("-f", String(firstPage));
    }

    if (lastPage !== undefined) {
      args.push("-l", String(lastPage));
    }

    args.push(resolvedInput, outputBase);

    const result = await runPdftoppm(args);

    if (result.code !== 0) {
      throw new Error(`pdftoppm failed with code ${result.code}: ${result.stderr || "unknown error"}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              message: "Conversion complete",
              outputDir: resolvedOutputDir,
              outputPattern: `${outputPrefix}-*.png`,
              command: `pdftoppm ${args.join(" ")}`
            },
            null,
            2
          )
        }
      ]
    };
  }
);

function runPdftoppm(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("pdftoppm", args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Unable to start pdftoppm: ${error.message}`));
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

const transport = new StdioServerTransport();
await server.connect(transport);
