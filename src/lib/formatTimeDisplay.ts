export default function formatTimeDisplay(decimal: number): string {
  if (!decimal || Number.isNaN(decimal)) return "0h 0m";

  let hours = Math.floor(decimal);
  let minutes = Math.round((decimal - hours) * 60);

  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }

  return `${hours}h ${minutes}m`;
}
