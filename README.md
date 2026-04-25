**anki-generator-system**
Processa arquivos de estudo em múltiplos formatos, gera flashcards via API Gemini e organiza os `.csv` resultantes por disciplina para importação no Anki.

## Requisitos

- Node.js v20 ou superior
- npm v10 ou superior
- Uma chave de API válida do Google Gemini (nível gratuito suportado)

## Instalação

```shell
git clone <url-do-repositorio>
```

```shell
cd anki-generator-system
```

```shell
npm install
```

```shell
cp .env.example .env
```

```shell
# abra o arquivo .env e preencha GEMINIKEY com sua chave real
```

As pastas `/content` e `/data` são criadas automaticamente na primeira execução.

## Configuração (.env)

| Variável | Valor padrão | Descrição |
| --- | --- | --- |
| GEMINIKEY | (obrigatório) | Chave de API do Google Gemini |
| GEMINIMODEL | gemini-2.5-pro-preview-06-05 | Modelo utilizado nas requisições |
| GEMINIRPMLIMIT | 10 | Máximo de requisições por minuto (janela deslizante) |
| GEMINIRPDLIMIT | 1000 | Máximo de requisições por dia |
| GEMINITPMLIMIT | 2000000 | Máximo de tokens por minuto |
| GEMINITPDLIMIT | 100000000 | Máximo de tokens por dia |
| MAXBLOCKTOKENS | 800000 | Teto de tokens por lote antes da margem de segurança |
| MAXTOTALINPUTTOKENS | 5000000 | Limite total de tokens aceitos em uma execução |
| TOKENSAFETYMARGIN | 0.75 | Fator de segurança aplicado ao limite de tokens (25% de desconto) |
| MAXBLOCKSIZEMB | 20 | Teto físico por lote em megabytes |
| APICONCURRENCY | 3 | Requisições simultâneas na fila `p-queue` |
| APICOOLDOWNMS | 3000 | Intervalo forçado em ms entre requisições |
| DATADIR | ./data | Pasta de entrada dos arquivos |
| CONTENTDIR | ./content | Pasta raiz de saída dos `.csv` |

As variáveis não usam underline e são escritas todas em maiúsculas sem separador (`NOMEVARIAVEL=valor`).

## Como usar

5.1 Coloque os arquivos para processar dentro da pasta `/data`. Subpastas são aceitas e o sistema percorre `/data` recursivamente.

5.2 Execute:

```shell
npm start
```

5.3 O sistema imprime logs prefixados (`[CHECK]`, `[EXTRACT]`, `[BATCH]`, `[API]`, `[OUTPUT]`) e ao final exibe um relatório com arquivos lidos, blocos enviados para a API, flashcards novos criados, duplicatas ignoradas e erros ocorridos.

## Formatos suportados

| Extensão | Método de extração |
| --- | --- |
| `.txt` | Leitura direta de texto |
| `.csv` | Conversão linha a linha para texto estruturado |
| `.pdf` | `pdf-parse` com fallback para OCR (`tesseract.js`) em PDFs escaneados |
| `.docx` | `mammoth` com fallback para OCR se o documento não tiver texto extraível |
| `.pptx` | Parse de XML interno slide a slide com fallback para OCR em slides-imagem |
| `.xlsx` | Conversão de sheets para texto via biblioteca `xlsx` |
| `.jpg` `.jpeg` `.png` `.webp` | OCR direto via `tesseract.js` com pré-processamento `sharp` |
| `.txt` contendo URLs do YouTube | Extração de transcrição via `youtube-transcript` |

Imagens passam por pré-processamento com `sharp` (redimensionamento para 2000px, escala de cinza, normalização de contraste) antes do OCR para aumentar a precisão do reconhecimento.

## Estrutura de saída

Os arquivos `.csv` são gerados dentro de `/content`, organizados na hierarquia de disciplinas e subáreas definida na estrutura de pastas. O Gemini determina automaticamente o caminho de destino com base no conteúdo processado. O nome do arquivo segue o padrão camelCase do assunto identificado (ex: `segundaLeiNewton.csv`).

Se um `.csv` já existir no destino, o sistema lê as perguntas existentes e acrescenta apenas flashcards novos, ignorando duplicatas. Se o texto contiver assuntos de disciplinas distintas, múltiplos `.csv` são gerados na mesma execução.

```txt
Pergunta;Resposta
Qual a fórmula da Segunda Lei de Newton?;F = m * a. Onde: F é a força (N), m é a massa (kg) e a é a aceleração (m/s²).
```

## Estrutura do projeto

```txt
raiz/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── data/
├── content/
│   ├── biologia/
│   ├── filosofia/
│   ├── fisica/
│   ├── geografia/
│   ├── historia/
│   ├── literatura/
│   ├── matematica/
│   ├── portugues/
│   └── quimica/
└── main/
    ├── index.js
    ├── api/
    │   └── geminiClient.js
    ├── batcher/
    │   └── createBatches.js
    ├── output/
    │   └── csvWriter.js
    ├── preprocess/
    │   ├── extractCsv.js
    │   ├── extractDocx.js
    │   ├── extractImage.js
    │   ├── extractPdf.js
    │   ├── extractPptx.js
    │   ├── extractTxt.js
    │   ├── extractXlsx.js
    │   └── extractYoutube.js
    ├── prompts/
    │   └── flashcardPrompt.js
    ├── tokenizer/
    │   └── countTokens.js
    └── utils/
        ├── checkDataDir.js
        ├── checkEnv.js
        ├── checkStructure.js
        ├── folderTree.js
        ├── report.js
        └── sanitizeName.js
```

## Controle de limites da API

O sistema implementa um rate limiter de janela deslizante de 60 segundos que monitora simultaneamente o número de requisições (RPM) e o volume de tokens (TPM). Antes de cada chamada, o cliente aguarda o tempo necessário para que a janela respeite ambos os limites.

Requisições passam por uma fila com concorrência configurável (padrão: 3 simultâneas) e um intervalo de cooldown entre cada slot liberado (padrão: 3000ms).

Em caso de resposta `429` da API, o sistema aplica backoff exponencial com até 4 tentativas, aguardando 2s, 4s, 8s e 16s respectivamente antes de cada retentativa.

## Importação no Anki

1. Abra o Anki e selecione o baralho de destino
2. Vá em Arquivo > Importar e selecione o arquivo `.csv` gerado
3. Configure o separador como ponto e vírgula (`;`) e mapeie o Campo 1 para Frente e o Campo 2 para Verso

## Licença

MIT.
