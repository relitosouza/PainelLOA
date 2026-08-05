const EXERCISE_PREFIX = /^\[(20\d{2})\]\s*/;

export function inferImportExercise(fileName: string, fallbackYear?: number) {
  const explicit = fileName.match(EXERCISE_PREFIX)?.[1] ?? fileName.match(/\b(20\d{2})\b/)?.[1];
  if (explicit) return Number(explicit);

  const abbreviated = fileName.match(/(?:loa|exerc[ií]cio|or[cç]amento)[\s_-]?(\d{2})(?!\d)/i)?.[1];
  if (abbreviated) return 2000 + Number(abbreviated);
  return fallbackYear ?? null;
}

export function cleanImportFileName(fileName: string) {
  return fileName.replace(EXERCISE_PREFIX, "");
}

export function fileNameWithExercise(fileName: string, exercise: number) {
  return `[${exercise}] ${cleanImportFileName(fileName)}`;
}

