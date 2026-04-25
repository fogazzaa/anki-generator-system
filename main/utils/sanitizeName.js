// Normaliza strings para nomes de arquivo seguros em camelCase.
export function sanitizeName(name) {
  const safeName = (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\/\\:*?"<>|]/g, "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const words = safeName
    .split(/[-\s]+/)
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);

  if (words.length === 0) {
    return "semNome";
  }

  return words
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
}
