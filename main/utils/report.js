// Mantem e imprime o relatorio agregado da execucao.
export const reportData = {
  arquivosLidos: 0,
  blocosEnviados: 0,
  flashcardsNovos: 0,
  duplicatasIgnoradas: 0,
  erros: [],
};

export function printReport() {
  console.log(`[RELATORIO] Arquivos lidos: ${reportData.arquivosLidos}`);
  console.log(`[RELATORIO] Blocos enviados para API: ${reportData.blocosEnviados}`);
  console.log(`[RELATORIO] Flashcards novos criados: ${reportData.flashcardsNovos}`);
  console.log(`[RELATORIO] Duplicatas ignoradas: ${reportData.duplicatasIgnoradas}`);
  console.log(`[RELATORIO] Erros: ${reportData.erros.length}`);
  if (reportData.erros.length > 0) {
    for (const erro of reportData.erros) {
      console.log(`[RELATORIO] - ${erro}`);
    }
  }
}
