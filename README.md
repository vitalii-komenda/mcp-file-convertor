# MCP PDF to PNG Converter

Simple MCP server that exposes one tool: `pdf_to_png`

## Requirements

- Node.js 18+
- `pdftoppm` CLI available in PATH (from Poppler)

macOS (Homebrew):

```bash
brew install poppler
```

## Install

```bash
npm install
```

## Example prompt for llm
```bash
convert sample.pdf to png and save near original file
```


## Run smoke test (end-to-end)

```bash
npm run smoke:test -- ./sample.pdf
```

The smoke test:
- starts the MCP server over stdio
- calls tool `pdf_to_png`
- verifies PNG output exists
- prints the MCP tool response

## Tool

### `pdf_to_png`

Inputs:
- `inputPdf` (string, required)
- `outputDir` (string, required)
- `outputPrefix` (string, optional, default `page`)
- `firstPage` (number, optional)
- `lastPage` (number, optional)
- `dpi` (number, optional, default `150`)

Output:
- text JSON with output directory and filename pattern

Generated files will look like:

```text
<outputDir>/<outputPrefix>-1.png
<outputDir>/<outputPrefix>-2.png
...
```

## Example MCP client config for vs code
* Open Command Palette
* MCP: Open User Configuration
* Add your server to the servers object
```json
{
  "servers": {
    "pdf-converter": {
      "type": "stdio",
      "command": "node",
      "args": [
        "local path to mcp-file-convertor/server.js"
      ]
    }
  }
}

```
## Example MCP client config for gemini cli
```json
// place this in ~/.gemini/settings.json
{
  "theme": "Default",
  "selectedAuthType": "oauth-personal",
  "mcpServers": {
    "pdf-converter": {
      "type": "stdio",
      "command": "node",
      "args": [
        "local path to mcp-file-convertor/server.js"
      ]
    }
  },
  "security": {
    "auth": {
      "selectedType": "oauth-personal"
    }
  }
}
