// Escreve flashcards em CSV com deduplicacao por pergunta.
import fs from "fs";
import path from "path";
import { sanitizeName } from "../utils/sanitizeName.js";
import { reportData } from "../utils/report.js";

function parseSafeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const cleaned = text.replace(/```json|\n```|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

function normalizeOutputPath(rawPath) {
  const normalized = String(rawPath ?? "").trim().replace(/\\/g, "/");
  const withoutLeadingSlash = normalized.replace(/^\/+/, "");
  const withoutContentPrefix = withoutLeadingSlash.replace(/^\.?\/?content\/?/i, "");
  return withoutContentPrefix;
}

export async function writeFlashcards(geminiResponseText, sourceFileName) {
  try {
    const parsed = parseSafeJson(geminiResponseText);
    if (parsed === null) {
      console.log(`[OUTPUT] ERRO: resposta não é JSON válido. Arquivo fonte: ${sourceFileName}`);
      return 0;
    }

    const entries = Array.isArray(parsed) ? parsed : [parsed];
    let totalNewLines = 0;

    for (const item of entries) {
      if (
        !item ||
        typeof item.assunto !== "string" ||
        typeof item.caminho !== "string" ||
        !Array.isArray(item.dados) ||
        item.dados.length < 5
      ) {
        console.log("[OUTPUT] AVISO: objeto ignorado por schema inválido.");
        continue;
      }

      const fallbackName = sanitizeName(path.basename(sourceFileName, path.extname(sourceFileName)));
      const assunto = item.assunto.trim() ? item.assunto : fallbackName;
      const fileName = sanitizeName(assunto);
      const contentDir = process.env.CONTENTDIR ?? "./content";
      const normalizedPath = normalizeOutputPath(item.caminho);
      const destinationFolder = path.join(contentDir, normalizedPath);
      fs.mkdirSync(destinationFolder, { recursive: true });

      const targetFile = path.join(destinationFolder, `${fileName}.csv`);
      const existingQuestions = new Set();

      if (fs.existsSync(targetFile)) {
        const previous = fs.readFileSync(targetFile, "utf-8");
        const lines = previous
          .split(/\r?\n/)
          .filter(Boolean)
          .filter((line) => line.trim() !== "Pergunta;Resposta");
        for (const line of lines) {
          const question = line.split(";")[0]?.trim();
          if (question) {
            existingQuestions.add(question);
          }
        }
      }

      const newLines = [];
      for (const row of item.dados) {
        if (typeof row !== "string" || !row.includes(";")) {
          continue;
        }
        const question = row.split(";")[0].trim();
        if (!question) {
          continue;
        }
        if (existingQuestions.has(question)) {
          reportData.duplicatasIgnoradas += 1;
          continue;
        }
        existingQuestions.add(question);
        newLines.push(row);
      }

      if (newLines.length === 0) {
        console.log(`[OUTPUT] 0 flashcard(s) novo(s) em: ${targetFile}`);
        continue;
      }

      const payload = `${newLines.join("\n")}\n`;
      if (!fs.existsSync(targetFile)) {
        fs.writeFileSync(targetFile, payload, "utf-8");
      } else {
        fs.appendFileSync(targetFile, payload, "utf-8");
      }

      reportData.flashcardsNovos += newLines.length;
      totalNewLines += newLines.length;
      console.log(`[OUTPUT] ${newLines.length} flashcard(s) novo(s) em: ${targetFile}`);
    }

    return totalNewLines;
  } catch (error) {
    console.log(`[OUTPUT] ERRO ao escrever CSV (${sourceFileName}): ${error.message}`);
    return 0;
  }
}
