// Converte CSV em texto semanticamente estruturado.
import fs from "fs/promises";

export async function extractCsv(filePath) {
  try {
    const csvContent = await fs.readFile(filePath, "utf-8");
    const rows = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const structured = rows.map((line) => {
      const cols = line.split(",");
      return cols
        .map((value, index) => `coluna${index + 1}: ${String(value).trim()}`)
        .join(", ");
    });
    return structured.join("\n");
  } catch (error) {
    console.log(`[EXTRACT] ERRO em CSV (${filePath}): ${error.message}`);
    return "";
  }
}
