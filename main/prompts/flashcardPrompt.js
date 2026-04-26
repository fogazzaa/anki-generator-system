export function buildFlashcardPrompt(rawText, folderTree, sourceFileName) {
  return `Você é um especialista em ciência do aprendizado e memória espaçada.
Sua única saída permitida é um array JSON válido.
Não escreva nada fora do JSON. Não use blocos markdown. Apenas o JSON.

MISSÃO:
Analisar o texto fornecido e retornar um array onde cada elemento representa um assunto
identificado. Cada elemento contém os metadados do assunto (caminho, tagCaminho, assunto)
e os cards gerados para aquele assunto.

PRINCÍPIOS DE QUALIDADE DOS CARDS:

PRINCÍPIO 1 — ATOMICIDADE OBRIGATÓRIA:
Cada card testa exatamente uma informação.
A resposta nunca exige mais de uma frase curta ou uma lista de no máximo 3 itens.
Se sentir vontade de escrever "e também...", crie um card separado.

PRINCÍPIO 2 — CAUSALIDADE SOBRE DEFINIÇÃO:
Evite perguntas do tipo "O que é X?" sempre que possível.
Prefira: "Por que X ocorre?", "Qual o efeito de X sobre Y?", "O que acontece com X
quando Y muda?", "Como X difere de Z?".
Exceção: termos técnicos onde a definição precisa é o próprio objeto de estudo.

PRINCÍPIO 3 — VARIÁVEIS E PROPORCIONALIDADE (somente Exatas):
Para cada fórmula ou relação matemática, crie ao menos um card de proporcionalidade.
Exemplo: "Se a distância entre dois corpos dobrar, o que acontece com a força
gravitacional?" → "A força cai para 1/4 do valor original, pois F é inversamente
proporcional ao quadrado da distância (Lei de Gravitação Universal)."
Explique o significado de cada símbolo no card onde a fórmula aparece pela primeira vez.

PRINCÍPIO 4 — CONTEXTO E EXEMPLO CONCRETO:
Quando o conceito for abstrato (jurídico, filosófico, econômico, biológico complexo),
acrescente uma "Dica" com um exemplo prático em 1 frase no campo correspondente.

PRINCÍPIO 5 — QUALIDADE SOBRE QUANTIDADE:
Máximo sugerido de 12 cards por assunto. Não existe mínimo.
Ignore informações triviais ou que qualquer pessoa responderia sem estudar.

SELEÇÃO DO TIPO DE CARD — aplique esta lógica para cada card:

  "tipo": "basic"
    Relação direcional, resposta em uma frase.

  "tipo": "basic-reversed"
    Conceito recuperável em qualquer direção. Inclua "inverter": "y".

  "tipo": "cloze"
    Definição técnica, lei enunciada ou processo sequencial.
    Campo "texto" com lacunas {{c1::termo}}, {{c2::termo}}, etc.
    Campo "extra" com contexto adicional opcional.
    Não inclua "pergunta" nem "resposta" em cards cloze.

  "tipo": "type-answer"
    Resposta é termo técnico único de 1 a 3 palavras. Estrutura igual ao basic.

CLASSIFICAÇÃO DE PASTA E TAG:

A estrutura de pastas é fixa. Nunca proponha a criação de novas pastas.
Para cada assunto identificado, defina:

  "caminho": caminho relativo dentro de /content usando a estrutura abaixo.
    Se houver pasta exata, use-a.
    Se não houver pasta exata, use a pasta pai de maior afinidade.
    Nunca invente caminhos que não existam na estrutura.

  "tagCaminho": derivado do caminho, com :: como separador, sempre iniciando com "main",
    cada segmento em camelCase.
    Se o assunto for mais granular que a pasta mais específica disponível,
    acrescente um quarto nível à tag com o tópico específico em camelCase.

    Exemplos:
      caminho "content/geografia/geografiaHumana"
      → tagCaminho "main::geografia::geografiaHumana"

      mesmo caminho, mas assunto específico "migrações"
      → tagCaminho "main::geografia::geografiaHumana::migracoes"

      caminho "content/fisica/mecanicaClassica"
      → tagCaminho "main::fisica::mecanicaClassica"

ESTRUTURA DE PASTAS DISPONÍVEL:
${folderTree}

SCHEMA DO JSON DE SAÍDA:
Retorne um array. Cada elemento representa um assunto.

[
  {
    "assunto": string em camelCase,
    "caminho": string — caminho relativo da pasta de destino,
    "tagCaminho": string — tag hierárquica com :: e camelCase em cada nível,
    "cards": [
      {
        "tipo": "basic" | "basic-reversed" | "cloze" | "type-answer",
        "pergunta": string (ausente em cloze),
        "resposta": string (ausente em cloze),
        "dica": string ou "" (ausente em cloze),
        "inverter": "y" (somente em basic-reversed),
        "texto": string com lacunas (somente em cloze),
        "extra": string ou "" (somente em cloze)
      }
    ]
  }
]

Se o texto não tiver assuntos claramente distintos, retorne um array com um único elemento.
Se o texto tiver assuntos de disciplinas diferentes, retorne um elemento por assunto.

Se o texto for genérico e o assunto não for identificável, use o nome do arquivo fonte
fornecido como "assunto" e escolha o caminho de maior afinidade disponível.

NOME DO ARQUIVO FONTE:
${sourceFileName}

TEXTO PARA PROCESSAR:
${rawText}`;
}
