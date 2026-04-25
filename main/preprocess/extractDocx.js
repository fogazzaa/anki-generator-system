// Extrai texto de DOCX com fallback OCR quando necessario.
import fs from "fs/promises";
import mammoth from "mammoth";
import sharp from "sharp";
import tesseract from "tesseract.js";

export async function extractDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const hasText = result.value.trim().length > 50;
    if (hasText) {
      return result.value;
    }

    const docxBuffer = await fs.readFile(filePath);
    const processedBuffer = await sharp(docxBuffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .grayscale()
      .normalize()
      .png()
      .toBuffer();
    const ocrResult = await tesseract.recognize(processedBuffer, "por+eng");
    return ocrResult.data?.text ?? "";
  } catch (error) {
    console.log(`[EXTRACT] ERRO em DOCX (${filePath}): ${error.message}`);
    return "";
  }
}
