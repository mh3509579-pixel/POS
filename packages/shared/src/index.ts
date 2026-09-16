export function combineDates(...dates: (Date | string)[]): Date {
  const result = new Date();
  for (const d of dates) {
    const date = new Date(d);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return result;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
