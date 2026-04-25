// Extrai texto de PPTX via XML e fallback OCR em imagens.
import fs from "fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import { parseStringPromise } from "xml2js";
import sharp from "sharp";
import tesseract from "tesseract.js";

function collectTextNodes(node, collected = []) {
  if (!node || typeof node !== "object") {
    return collected;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "a:t" && Array.isArray(value)) {
      for (const text of value) {
        if (typeof text === "string") {
          collected.push(text);
        }
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        collectTextNodes(item, collected);
      }
    } else if (typeof value === "object") {
      collectTextNodes(value, collected);
    }
  }
  return collected;
}

export async function extractPptx(filePath) {
  try {
    const pptxBuffer = await fs.readFile(filePath);
    const zipEntries = unzipSync(new Uint8Array(pptxBuffer));
    const fileNames = Object.keys(zipEntries);
    const slideFiles = fileNames
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const mediaFiles = fileNames
      .filter((name) => /^ppt\/media\/.+\.(png|jpe?g|webp)$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const slides = [];
    for (let index = 0; index < slideFiles.length; index += 1) {
      const slidePath = slideFiles[index];
      const slideXml = strFromU8(zipEntries[slidePath]);
      const parsed = await parseStringPromise(slideXml);
      const extractedText = collectTextNodes(parsed, []).join(" ").trim();

      let finalText = extractedText;
      if (extractedText.length < 20 && mediaFiles[index]) {
        const mediaBuffer = Buffer.from(zipEntries[mediaFiles[index]]);
        const processed = await sharp(mediaBuffer)
          .resize({ width: 2000, withoutEnlargement: true })
          .grayscale()
          .normalize()
          .png()
          .toBuffer();
        const ocrResult = await tesseract.recognize(processed, "por+eng");
        finalText = ocrResult.data?.text ?? "";
      }

      slides.push(`\n\n--- Slide ${index + 1} ---\n\n${finalText}`);
    }

    return slides.join("\n");
  } catch (error) {
    console.log(`[EXTRACT] ERRO em PPTX (${filePath}): ${error.message}`);
    return "";
  }
}
