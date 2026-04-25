// Busca transcricoes de URLs do YouTube listadas em arquivo texto.
import fs from "fs/promises";
import { YoutubeTranscript } from "youtube-transcript/dist/youtube-transcript.esm.js";

const youtubeRegex = /(?:youtu\.be\/|youtube\.com\/watch\?v=)[\w-]+/;

export async function extractYoutube(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf-8");
    const lines = text.split(/\r?\n/).map((line) => line.trim());
    const urls = lines.filter((line) => youtubeRegex.test(line));

    const chunks = [];
    for (const url of urls) {
      try {
        const segments = await YoutubeTranscript.fetchTranscript(url);
        const transcriptText = segments.map((segment) => segment.text).join(" ");
        chunks.push(`\n\n--- Transcrição: ${url} ---\n\n${transcriptText}`);
      } catch {
        console.log(`[EXTRACT] AVISO: falha ao obter transcrição de ${url}`);
      }
    }

    return chunks.join("\n");
  } catch (error) {
    console.log(`[EXTRACT] ERRO em YouTube TXT (${filePath}): ${error.message}`);
    return "";
  }
}
