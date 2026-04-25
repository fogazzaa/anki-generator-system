// Monta o prompt pedagogico para geracao de flashcards.
export function buildFlashcardPrompt(rawText, folderTree, sourceFileName) {
  return `Você é um especialista em pedagogia e criação de flashcards para o Anki.
Sua única saída permitida é um array JSON válido. Não escreva nenhum texto fora do JSON.
Não use blocos de código markdown. Não adicione explicações. Responda apenas com o JSON.

REGRAS DE FORMATAÇÃO DO JSON:
- O JSON deve ser um array, mesmo que contenha apenas um objeto.
- Cada objeto representa um assunto identificado no texto.
- Schema obrigatório de cada objeto:
  {
    "assunto": string em camelCase,
    "caminho": string com o caminho relativo da pasta de destino,
    "pastaNova": boolean,
    "dados": array de strings no formato "Pergunta?;Resposta"
  }

REGRAS DE CONTEÚDO:

1. CIÊNCIAS EXATAS (Matemática, Física, Química):
   - Priorize fórmulas acima de qualquer outro conteúdo.
   - Para cada fórmula, explique o significado de cada símbolo na resposta.
   - Use caracteres padrão para fórmulas simples (F = m * a).
   - Use notação LaTeX apenas para fórmulas complexas com frações, integrais ou somatórios.
   - Inclua também flashcards sobre conceitos, definições e aplicações práticas.
   - Mínimo de 5 pares pergunta/resposta por objeto.

2. CIÊNCIAS HUMANAS E BIOLÓGICAS (História, Filosofia, Biologia, Literatura, etc.):
   - Priorize datas, nomes, eventos e definições precisas.
   - Inclua relações de causa e efeito onde relevante.
   - Mínimo de 5 pares pergunta/resposta por objeto.

3. SEPARAÇÃO DE ASSUNTOS:
   - Se o texto contiver assuntos claramente distintos, crie um objeto separado para cada um.
   - Um assunto é "claramente distinto" quando pertenceria a disciplinas ou subáreas diferentes.

4. CLASSIFICAÇÃO DE PASTA:
   - Use a estrutura de pastas fornecida abaixo para definir o campo "caminho".
   - Se o assunto se encaixar exatamente em uma pasta existente, use-a. pastaNova = false.
   - Se não houver pasta exata mas houver uma pasta pai de maior afinidade, use a pasta pai.
     pastaNova = false. Não invente caminhos que não existam na estrutura.
   - Só marque pastaNova = true se o assunto exigir uma subpasta GENUINAMENTE nova
     que não tem equivalente na estrutura. Nesse caso, proponha um nome em camelCase
     dentro da pasta pai mais adequada.
   - Se você não conseguir identificar o assunto do texto, use o nome do arquivo fonte
     fornecido ao final deste prompt como "assunto", coloque em content/ diretamente
     e marque pastaNova = false.

ESTRUTURA DE PASTAS ATUAL:
${folderTree}

NOME DO ARQUIVO FONTE (use como fallback de assunto se necessário):
${sourceFileName}

TEXTO PARA PROCESSAR:
${rawText}`;
}
