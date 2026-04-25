// Extrai texto de PDF via texto nativo ou OCR por pagina.
import fs from "fs/promises";
import pdfParse from "pdf-parse";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";
import tesseract from "tesseract.js";

export async function extractPdf(filePath) {
  try {
    const pdfBuffer = await fs.readFile(filePath);
    const parsed = await pdfParse(pdfBuffer);
    const pages = parsed.numpages || 1;
    const avgChars = (parsed.text ?? "").length / pages;
    if (avgChars >= 80) {
      return parsed.text ?? "";
    }

    const pdfDocument = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    const chunks = [];
    for (let pageIndex = 0; pageIndex < pdfDocument.numPages; pageIndex += 1) {
      const pageBuffer = await sharp(pdfBuffer, { page: pageIndex, density: 220 })
        .resize({ width: 2000, withoutEnlargement: true })
        .grayscale()
        .normalize()
        .png()
        .toBuffer();
      const ocrResult = await tesseract.recognize(pageBuffer, "por+eng");
      chunks.push(ocrResult.data?.text ?? "");
    }
    return chunks.join("\n\n");
  } catch (error) {
    console.log(`[EXTRACT] ERRO em PDF (${filePath}): ${error.message}`);
    return "";
  }
}
