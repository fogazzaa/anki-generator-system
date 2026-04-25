// Inspeciona a pasta de entrada e valida volume de arquivos.
import fs from "fs";
import path from "path";

function listFilesRecursive(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(entryPath));
    } else if (entry.isFile()) {
      files.push(path.resolve(entryPath));
    }
  }
  return files;
}

export function checkDataDir() {
  try {
    const dataDir = path.resolve(process.env.DATADIR ?? "./data");
    if (!fs.existsSync(dataDir)) {
      console.log("[CHECK] Nenhum arquivo encontrado em /data");
      process.exit(1);
    }

    const files = listFilesRecursive(dataDir);
    if (files.length === 0) {
      console.log("[CHECK] Nenhum arquivo encontrado em /data");
      process.exit(1);
    }

    let totalBytes = 0;
    for (const filePath of files) {
      totalBytes += fs.statSync(filePath).size;
    }

    const totalMb = totalBytes / (1024 * 1024);
    if (totalMb > 100) {
      console.log(`[CHECK] AVISO: /data ultrapassa 100MB (${totalMb.toFixed(2)}MB) mas continua`);
    }

    return files;
  } catch (error) {
    console.log(`[CHECK] ERRO ao verificar /data: ${error.message}`);
    process.exit(1);
  }
}
