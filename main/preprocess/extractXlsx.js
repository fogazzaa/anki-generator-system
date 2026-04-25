// Extrai dados de planilhas e converte para texto estruturado.
import readXlsxFile, { readSheetNames } from "read-excel-file/node";

export async function extractXlsx(filePath) {
  try {
    const sheetNames = await readSheetNames(filePath);
    const blocks = [];

    for (const sheetName of sheetNames) {
      const rows = await readXlsxFile(filePath, { sheet: sheetName });
      const textRows = rows.map((row) => row.map((value, index) => `coluna${index + 1}: ${value ?? ""}`).join(" | "));
      blocks.push(`\n\n--- Sheet: ${sheetName} ---\n${textRows.join("\n")}`);
    }

    return blocks.join("\n");
  } catch (error) {
    console.log(`[EXTRACT] ERRO em XLSX (${filePath}): ${error.message}`);
    return "";
  }
}
