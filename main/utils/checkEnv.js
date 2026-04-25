// Valida variaveis de ambiente obrigatorias antes da execucao.
import dotenv from "dotenv";

export function checkEnv() {
  dotenv.config();
  const requiredVars = [
    "GEMINIKEY",
    "GEMINIMODEL",
    "MAXBLOCKTOKENS",
    "MAXTOTALINPUTTOKENS",
    "TOKENSAFETYMARGIN",
  ];

  for (const envName of requiredVars) {
    const value = process.env[envName];
    if (!value || String(value).trim().length === 0) {
      console.log(`[CHECK] Variavel obrigatoria ausente: ${envName}`);
      process.exit(1);
    }
  }
}
