export const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const integer = new Intl.NumberFormat("pt-BR");
export const percent = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function splitCode(value: string) {
  const [code, ...name] = value.split(/\s+-\s+/);
  return { code: name.length ? code.trim() : "—", name: name.length ? name.join(" - ").trim() : value };
}

