import fs from "fs";
import path from "path";
import { sanitizeName } from "../utils/sanitizeName.js";
import { reportData } from "../utils/report.js";

export async function writeFlashcards(geminiResponseText, sourceFileName) {
  try {
    const contentDir = process.env.CONTENTDIR ?? "./content";
    const parsedData = parseResponseJson(geminiResponseText);
    if (parsedData === null) {
      console.log(`[OUTPUT] ERRO: resposta não é JSON válido. Arquivo: ${sourceFileName}`);
      return 0;
    }

    const assuntos = Array.isArray(parsedData) ? parsedData : [parsedData];
    let totalCardsNovos = 0;
    const fallbackAssunto = sanitizeName(path.basename(sourceFileName, path.extname(sourceFileName)));

    for (const elemento of assuntos) {
      if (!elemento || typeof elemento.caminho !== "string" || !Array.isArray(elemento.cards)) {
        console.log("[OUTPUT] AVISO: assunto ignorado por schema inválido.");
        continue;
      }

      const assuntoRaw = typeof elemento.assunto === "string" ? elemento.assunto : "";
      const assuntoNormalizado = assuntoRaw.trim() ? assuntoRaw : fallbackAssunto;
      const nomeBase = sanitizeName(assuntoNormalizado);
      const caminhoNormalizado = normalizeCaminho(elemento.caminho);
      const pastaDestino = path.join(contentDir, caminhoNormalizado);
      fs.mkdirSync(pastaDestino, { recursive: true });

      const tagCaminhoRaw = typeof elemento.tagCaminho === "string" ? elemento.tagCaminho : "";
      const tagCaminho = tagCaminhoRaw.trim()
        ? tagCaminhoRaw
        : `main::${caminhoNormalizado.replace(/^content\//, "").replace(/\//g, "::")}`;

      const cardsByTipo = {
        basic: elemento.cards.filter((card) => card?.tipo === "basic"),
        "basic-reversed": elemento.cards.filter((card) => card?.tipo === "basic-reversed"),
        cloze: elemento.cards.filter((card) => card?.tipo === "cloze"),
        "type-answer": elemento.cards.filter((card) => card?.tipo === "type-answer"),
      };

      const tiposPresentes = [];
      for (const card of elemento.cards) {
        const tipo = card?.tipo;
        if (cardsByTipo[tipo]?.length > 0 && !tiposPresentes.includes(tipo)) {
          tiposPresentes.push(tipo);
        }
      }
      const tiposSelecionados = tiposPresentes.slice(0, 2);
      const tiposIgnorados = tiposPresentes.slice(2);
      if (tiposIgnorados.length > 0) {
        console.log(`[OUTPUT] AVISO: tipos excedentes ignorados (${tiposIgnorados.join(", ")}).`);
      }

      for (const tipo of tiposSelecionados) {
        const cardsTipo = cardsByTipo[tipo];
        const sufixo = getSufixoTipo(tipo);
        const nomeArquivo = path.join(pastaDestino, `${nomeBase}${sufixo}.csv`);
        totalCardsNovos += writeCards(cardsTipo, nomeArquivo, pastaDestino, tagCaminho, tipo);
      }
    }

    return totalCardsNovos;
  } catch (error) {
    console.log(`[OUTPUT] ERRO ao escrever CSV (${sourceFileName}): ${error.message}`);
    return 0;
  }
}

function normalizeCaminho(caminho) {
  const raw = String(caminho ?? "").trim().replace(/\\/g, "/");
  const semPrefixo = raw.replace(/^\.?\/?content\/?/i, "");
  return semPrefixo || "";
}

function getSufixoTipo(tipo) {
  if (tipo === "basic") return "B";
  if (tipo === "basic-reversed") return "R";
  if (tipo === "cloze") return "C";
  if (tipo === "type-answer") return "T";
  return "B";
}

function parseResponseJson(text) {
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

function writeCards(cards, nomeArquivo, pastaDestino, tagCaminho, tipoNoteType) {
  try {
    fs.mkdirSync(pastaDestino, { recursive: true });

    const arquivoExiste = fs.existsSync(nomeArquivo);
    const existentes = new Set();

    if (arquivoExiste) {
      const conteudoExistente = fs.readFileSync(nomeArquivo, "utf-8");
      const linhas = conteudoExistente.split(/\r?\n/).filter((linha) => linha.trim());

      for (const linha of linhas) {
        if (linha.startsWith("tags: ")) continue;
        const chave = linha.split(";")[0]?.trim();
        if (chave) {
          existentes.add(chave);
        }
      }
    }

    const cardsNovos = [];
    for (const card of cards) {
      const chaveCard =
        tipoNoteType === "cloze"
          ? String(card?.texto ?? "").trim()
          : String(card?.pergunta ?? "").trim();

      if (!chaveCard) {
        continue;
      }
      if (existentes.has(chaveCard)) {
        reportData.duplicatasIgnoradas += 1;
        continue;
      }

      existentes.add(chaveCard);
      cardsNovos.push(card);
    }

    if (cardsNovos.length === 0) {
      return 0;
    }

    const linhasCards = cardsNovos.map((card) => {
      if (tipoNoteType === "cloze") {
        return `${String(card?.texto ?? "").trim()};${String(card?.extra ?? "").trim()}`;
      }

      if (tipoNoteType === "type-answer") {
        return `${String(card?.pergunta ?? "").trim()};${String(card?.resposta ?? "").trim()};${String(
          card?.dica ?? "",
        ).trim()}`;
      }

      if (card?.tipo === "basic-reversed") {
        return `${String(card?.pergunta ?? "").trim()};${String(card?.resposta ?? "").trim()};${String(
          card?.dica ?? "",
        ).trim()};${String(card?.inverter ?? "y").trim()}`;
      }

      return `${String(card?.pergunta ?? "").trim()};${String(card?.resposta ?? "").trim()};${String(
        card?.dica ?? "",
      ).trim()};`;
    });

    if (!arquivoExiste) {
      const conteudoNovo = [`tags: ${tagCaminho}`, ...linhasCards].join("\n");
      fs.writeFileSync(nomeArquivo, conteudoNovo, "utf-8");
    } else {
      fs.appendFileSync(nomeArquivo, `\n${linhasCards.join("\n")}`, "utf-8");
    }

    reportData.flashcardsNovos += linhasCards.length;
    console.log(`[OUTPUT] ${linhasCards.length} card(s) ${tipoNoteType} novo(s) em: ${nomeArquivo}`);
    return linhasCards.length;
  } catch (error) {
    console.log(`[OUTPUT] ERRO ao escrever arquivo ${nomeArquivo}: ${error.message}`);
    return 0;
  }
}
