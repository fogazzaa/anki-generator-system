// Conta tokens com tiktoken para estimativa de entrada.
import { get_encoding } from "tiktoken";

const encoder = get_encoding("cl100k_base");

export function countTokens(text) {
  return encoder.encode(text ?? "").length;
}
