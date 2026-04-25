// Garante a estrutura minima de pastas de saida e execucao.
import fs from "fs";
import path from "path";

const contentFolders = [
  "content/biologia/citologia",
  "content/biologia/genetica",
  "content/biologia/ecologia",
  "content/biologia/fisiologiaAnimal",
  "content/biologia/botanica",
  "content/biologia/evolucao",
  "content/filosofia/filosofiaAntiga",
  "content/filosofia/filosofiaMedieval",
  "content/filosofia/filosofiaModerna",
  "content/filosofia/filosofiaContemporanea",
  "content/filosofia/eticaMoral",
  "content/filosofia/politicaSociedade",
  "content/fisica/mecanicaClassica",
  "content/fisica/termologia",
  "content/fisica/opticaGeometrica",
  "content/fisica/ondas",
  "content/fisica/eletromagnetismo",
  "content/fisica/fisicaModerna",
  "content/geografia/geografiaFisica",
  "content/geografia/geografiaHumana",
  "content/geografia/geopolitica",
  "content/geografia/geografiaEconomica",
  "content/geografia/cartografia",
  "content/geografia/meioAmbiente",
  "content/historia/historiaAntiga",
  "content/historia/historiaMedieval",
  "content/historia/historiaModerna",
  "content/historia/historiaContemporanea",
  "content/historia/historiaBrasilColonia",
  "content/historia/historiaBrasilRepublica",
  "content/literatura/teoriaLiteraria",
  "content/literatura/quinhentismoBarroco",
  "content/literatura/arcadismoRomantismo",
  "content/literatura/realismoNaturalismo",
  "content/literatura/modernismo",
  "content/literatura/literaturaContemporanea",
  "content/matematica/aritmetica",
  "content/matematica/algebra",
  "content/matematica/geometriaPlana",
  "content/matematica/geometriaEspacial",
  "content/matematica/trigonometria",
  "content/matematica/probabilidadeEstatistica",
  "content/portugues/gramaticaNormativa",
  "content/portugues/interpretacaoTexto",
  "content/portugues/redacao",
  "content/portugues/morfossintaxe",
  "content/portugues/semantica",
  "content/portugues/fonologia",
  "content/quimica/quimicaGeral",
  "content/quimica/fisicoQuimica",
  "content/quimica/quimicaOrganica",
  "content/quimica/quimicaInorganica",
  "content/quimica/atomistica",
  "content/quimica/eletroquimica",
];

const mainSubdirs = [
  "main",
  "main/preprocess",
  "main/tokenizer",
  "main/batcher",
  "main/api",
  "main/output",
  "main/utils",
  "main/prompts",
];

export function checkStructure() {
  for (const folder of contentFolders) {
    const folderPath = path.resolve(folder);
    const exists = fs.existsSync(folderPath);
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`[CHECK] ${exists ? "pasta ok" : "pasta criada"}: ${folderPath}`);
  }

  for (const folder of mainSubdirs) {
    if (!fs.existsSync(path.resolve(folder))) {
      console.log(`[CHECK] AVISO: pasta esperada ausente em /main: ${folder}`);
    }
  }
}
