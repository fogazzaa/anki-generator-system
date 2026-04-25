// Orquestra o pipeline completo de extracao, loteamento, API e escrita de CSV.
import fs from "fs/promises";
import path from "path";
import { checkEnv } from "./utils/checkEnv.js";
import { checkStructure } from "./utils/checkStructure.js";
import { checkDataDir } from "./utils/checkDataDir.js";
import { getFolderTree } from "./utils/folderTree.js";
import { reportData, printReport } from "./utils/report.js";
import { extractTxt } from "./preprocess/extractTxt.js";
import { extractCsv } from "./preprocess/extractCsv.js";
import { extractPdf } from "./preprocess/extractPdf.js";
import { extractDocx } from "./preprocess/extractDocx.js";
import { extractPptx } from "./preprocess/extractPptx.js";
import { extractXlsx } from "./preprocess/extractXlsx.js";
import { extractImage } from "./preprocess/extractImage.js";
import { extractYoutube } from "./preprocess/extractYoutube.js";
import { createBatches } from "./batcher/createBatches.js";
import { callGemini, apiQueue } from "./api/geminiClient.js";
import { buildFlashcardPrompt } from "./prompts/flashcardPrompt.js";
import { writeFlashcards } from "./output/csvWriter.js";

async function dispatchExtractor(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".txt") {
      const text = await extractTxt(filePath);
      if (/(?:youtu\.be\/|youtube\.com\/watch\?v=)[\w-]+/i.test(text)) {
        return await extractYoutube(filePath);
      }
      return text;
    }
    if (ext === ".csv") return await extractCsv(filePath);
    if (ext === ".pdf") return await extractPdf(filePath);
    if (ext === ".docx" || ext === ".doc") return await extractDocx(filePath);
    if (ext === ".pptx" || ext === ".ppt") return await extractPptx(filePath);
    if (ext === ".xlsx" || ext === ".xls") return await extractXlsx(filePath);
    if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return await extractImage(filePath);
    console.log(`[EXTRACT] AVISO: extensão não suportada: ${ext}`);
    return "";
  } catch (error) {
    console.log(`[EXTRACT] ${error.message}`);
    return "";
  }
}

async function main() {
  const queuePromises = [];
  try {
    checkEnv();
  } catch (error) {
    console.log(`[INDEX] ERRO na etapa de ambiente: ${error.message}`);
    process.exit(1);
  }

  try {
    checkStructure();
  } catch (error) {
    reportData.erros.push(`Falha na estrutura: ${error.message}`);
  }

  let arquivos = [];
  try {
    arquivos = checkDataDir();
  } catch (error) {
    console.log(`[INDEX] ERRO na verificação de /data: ${error.message}`);
    process.exit(1);
  }

  const extractedItems = [];
  try {
    for (const arquivo of arquivos) {
      const texto = await dispatchExtractor(arquivo);
      if (!texto.trim()) {
        console.log(`[INDEX] AVISO: sem texto extraído de ${arquivo}`);
        continue;
      }
      extractedItems.push({ fileName: path.basename(arquivo), text: texto });
      reportData.arquivosLidos += 1;
    }
  } catch (error) {
    reportData.erros.push(`Falha na extração: ${error.message}`);
  }

  let batches = [];
  try {
    batches = createBatches(extractedItems);
    console.log(`[INDEX] ${batches.length} lote(s) criado(s) para ${extractedItems.length} arquivo(s)`);
  } catch (error) {
    reportData.erros.push(`Falha no loteamento: ${error.message}`);
  }

  let folderTree = "";
  try {
    folderTree = getFolderTree(path.resolve(process.env.CONTENTDIR ?? "./content"));
  } catch (error) {
    reportData.erros.push(`Falha ao montar árvore: ${error.message}`);
  }

  try {
    for (let i = 0; i < batches.length; i += 1) {
      const batch = batches[i];
      const textBatch = batch.map((item) => `\n\n---ARQUIVO: ${item.fileName}---\n\n${item.text}`).join("");
      const sourceFileName = batch[0]?.fileName ?? "arquivoDesconhecido.txt";
      const prompt = buildFlashcardPrompt(textBatch, folderTree, sourceFileName);
      console.log(`[INDEX] Enviando lote ${i + 1}/${batches.length}...`);

      const taskPromise = (async () => {
        try {
          const response = await callGemini(prompt);
          await writeFlashcards(response, sourceFileName);
          reportData.blocosEnviados += 1;
        } catch (error) {
          reportData.erros.push(`Erro no lote ${i + 1}: ${error.message}`);
        }
      })();

      queuePromises.push(taskPromise);
    }
  } catch (error) {
    reportData.erros.push(`Falha no envio dos lotes: ${error.message}`);
  }

  await Promise.allSettled(queuePromises);
  await apiQueue.onIdle();
  printReport();
}

await main();
