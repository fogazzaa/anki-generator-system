// Gera representacao em arvore dos diretorios.
import fs from "fs";
import path from "path";

function buildTree(currentPath, depth, maxDepth, prefix, isLast) {
  if (depth > maxDepth) {
    return "";
  }

  const dirName = path.basename(currentPath);
  const connector = depth === 0 ? "" : isLast ? "└── " : "├── ";
  let output = `${prefix}${connector}${dirName}\n`;

  if (depth === maxDepth) {
    return output;
  }

  let entries = [];
  try {
    entries = fs
      .readdirSync(currentPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return output;
  }

  const childPrefix = depth === 0 ? "" : `${prefix}${isLast ? "    " : "│   "}`;
  entries.forEach((entry, index) => {
    const childPath = path.join(currentPath, entry.name);
    output += buildTree(childPath, depth + 1, maxDepth, childPrefix, index === entries.length - 1);
  });

  return output;
}

export function getFolderTree(basePath, depth = 0, maxDepth = 4) {
  return buildTree(basePath, depth, maxDepth, "", true).trimEnd();
}
