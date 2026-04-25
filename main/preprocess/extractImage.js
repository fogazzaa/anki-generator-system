// Extrai texto de imagens usando OCR com preprocessamento.
import fs from "fs/promises";
import sharp from "sharp";
import tesseract from "tesseract.js";

export async function extractImage(filePath) {
  try {
    const imageBuffer = await fs.readFile(filePath);
    const processedBuffer = await sharp(imageBuffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .grayscale()
      .normalize()
      .png()
      .toBuffer();

    const result = await tesseract.recognize(processedBuffer, "por+eng");
    return result.data?.text ?? "";
  } catch (error) {
    console.log(`[EXTRACT] ERRO em imagem (${filePath}): ${error.message}`);
    return "";
  }
}
