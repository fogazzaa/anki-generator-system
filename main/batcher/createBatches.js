// Cria lotes de arquivos com limites de tokens e tamanho.
import { countTokens } from "../tokenizer/countTokens.js";

function splitLargeItem(item, limiteTokens) {
  const parts = [];
  let remaining = item.text;
  let partIndex = 1;

  while (countTokens(remaining) > limiteTokens) {
    const roughCut = Math.floor((remaining.length * limiteTokens) / countTokens(remaining));
    const splitAt = remaining.lastIndexOf("\n\n", roughCut);
    const cutPoint = splitAt > 0 ? splitAt : roughCut;
    const currentPart = remaining.slice(0, cutPoint).trim();
    if (!currentPart) {
      break;
    }
    parts.push({
      fileName: `${item.fileName}_parte${partIndex}`,
      text: currentPart,
      tokens: countTokens(currentPart),
      bytes: Buffer.byteLength(currentPart, "utf8"),
    });
    remaining = remaining.slice(cutPoint).trim();
    partIndex += 1;
  }

  if (remaining) {
    parts.push({
      fileName: `${item.fileName}_parte${partIndex}`,
      text: remaining,
      tokens: countTokens(remaining),
      bytes: Buffer.byteLength(remaining, "utf8"),
    });
  }

  return parts;
}

export function createBatches(items) {
  const maxBlockTokens = Number(process.env.MAXBLOCKTOKENS ?? 800000);
  const tokenSafetyMargin = Number(process.env.TOKENSAFETYMARGIN ?? 0.75);
  const maxTotalTokens = Number(process.env.MAXTOTALINPUTTOKENS ?? 5000000);
  const maxBlockSizeMb = Number(process.env.MAXBLOCKSIZEMB ?? 20);
  const limiteTokens = Math.floor(maxBlockTokens * tokenSafetyMargin);
  const limiteMb = maxBlockSizeMb * 1024 * 1024;

  const normalized = [];
  for (const item of items) {
    const tokens = countTokens(item.text);
    if (tokens > limiteTokens) {
      console.log(`[BATCH] AVISO: arquivo ${item.fileName} excede limite por lote e sera dividido.`);
      normalized.push(...splitLargeItem(item, limiteTokens));
    } else {
      normalized.push({
        ...item,
        tokens,
        bytes: Buffer.byteLength(item.text, "utf8"),
      });
    }
  }

  let totalTokens = normalized.reduce((sum, item) => sum + item.tokens, 0);
  let discarded = 0;
  while (totalTokens > maxTotalTokens && normalized.length > 0) {
    const removed = normalized.pop();
    totalTokens -= removed.tokens;
    discarded += 1;
  }
  if (discarded > 0) {
    console.log(`[BATCH] AVISO: limite total de tokens atingido. ${discarded} arquivo(s) não serão processados.`);
  }

  const sorted = [...normalized].sort((a, b) => b.tokens - a.tokens);
  const bins = [];
  const binMeta = [];

  for (const item of sorted) {
    if (item.tokens > limiteTokens) {
      console.log(`[BATCH] AVISO: item ${item.fileName} sozinho ultrapassa o limite por request.`);
    }

    let placed = false;
    for (let index = 0; index < bins.length; index += 1) {
      const canFitTokens = binMeta[index].tokens + item.tokens <= limiteTokens;
      const canFitBytes = binMeta[index].bytes + item.bytes <= limiteMb;
      if (canFitTokens && canFitBytes) {
        bins[index].push({ fileName: item.fileName, text: item.text });
        binMeta[index].tokens += item.tokens;
        binMeta[index].bytes += item.bytes;
        placed = true;
        break;
      }
    }

    if (!placed) {
      bins.push([{ fileName: item.fileName, text: item.text }]);
      binMeta.push({ tokens: item.tokens, bytes: item.bytes });
    }
  }

  return bins;
}
