// Extrai texto bruto de arquivos .txt.
import fs from "fs/promises";

export async function extractTxt(filePath) {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    console.log(`[EXTRACT] ERRO em TXT (${filePath}): ${error.message}`);
    return "";
  }
}
