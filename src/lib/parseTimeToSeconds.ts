export function parseTimeToSeconds(input: string | number): number {
  if (typeof input === "number") {
    // Si nombre < 100, considérer comme heures, sinon secondes
    return input < 100 ? hoursToSeconds(input) : Math.round(input);
  }

  const str = String(input).trim().toLowerCase();

  // Format spécial "5h 56" ou "5h56" (heures + nombre sans unité = minutes)
  const hourMinPattern = /^(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*(\d+(?:\.\d+)?)$/i;
  const hourMinMatch = str.match(hourMinPattern);
  if (hourMinMatch) {
    const hours = parseFloat(hourMinMatch[1]);
    const minutes = parseFloat(hourMinMatch[2]);
    return Math.round(hours * 3600 + minutes * 60);
  }

  // Format avec unités: "1h30m", "1h 30m", "30m", "45s", "1h 30m 15s"
  const timePattern =
    /(?:(\d+(?:\.\d+)?)\s*h(?:ours?)?)?(?:\s*(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?)?(?:\s*(\d+(?:\.\d+)?)\s*s(?:ec(?:ond)?s?)?)?/i;
  const match = str.match(timePattern);

  if (match && (match[1] || match[2] || match[3])) {
    const hours = parseFloat(match[1] || "0");
    const minutes = parseFloat(match[2] || "0");
    const seconds = parseFloat(match[3] || "0");
    return Math.round(hours * 3600 + minutes * 60 + seconds);
  }

  // Format "HH:MM" ou "H:MM" ou "HH:MM:SS"
  if (str.includes(":")) {
    const parts = str.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 3600 + parts[1] * 60;
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  // Format décimal "2.5" (heures)
  const decimal = parseFloat(str);
  if (!isNaN(decimal)) {
    return decimal < 100 ? hoursToSeconds(decimal) : Math.round(decimal);
  }

  return 0;
}

export function hoursToSeconds(hours: number): number {
  return Math.round(hours * 3600);
}

export function secondsToHours(seconds: number): number {
  return seconds / 3600;
}

export function formatTimeDisplay(decimal: number): string {
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    return "0h 0m";
  }

  let hours = Math.floor(decimal);
  let minutes = Math.round((decimal - hours) * 60);

  // Handle 60 minutes edge case
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }

  return `${hours}h ${minutes}m`;
}
