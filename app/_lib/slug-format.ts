// Vira subdomínio (um rótulo de DNS): letras minúsculas, números e hífens,
// sem hífen nas pontas. Sem dependências para poder rodar no navegador.
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/

export const SLUG_FORMAT_MESSAGE =
  "O endereço precisa ter de 3 a 50 caracteres, só com letras minúsculas, números e hífen (sem hífen no começo ou no fim)."

export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
