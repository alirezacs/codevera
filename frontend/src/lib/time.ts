export function endTime(start: string, duration: number) {
  const [hour, minute] = start.split(":").map(Number);
  const total = hour * 60 + minute + duration;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
