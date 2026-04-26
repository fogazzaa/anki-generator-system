// Extrai dados de planilhas e converte para texto estruturado.
import readXlsxFile from "read-excel-file/node";

export async function extractXlsx(filePath) {
  try {
    const sheets = await readXlsxFile(filePath);
    const blocks = [];

    for (const sheetData of sheets) {
      const sheetName = sheetData?.sheet ?? "Sheet";
      const rows = Array.isArray(sheetData?.data) ? sheetData.data : [];
      const textRows = rows.map((row) => row.map((value, index) => `coluna${index + 1}: ${value ?? ""}`).join(" | "));
      blocks.push(`\n\n--- Sheet: ${sheetName} ---\n${textRows.join("\n")}`);
    }

    return blocks.join("\n");
  } catch (error) {
    console.log(`[EXTRACT] ERRO em XLSX (${filePath}): ${error.message}`);
    return "";
  }
}
