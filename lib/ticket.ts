export function genTicket(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const num = String(Math.floor(1000 + Math.random() * 9000));
  return `VTP-${y}${m}${day}-${num}`;
}

export function validateTicket(ticket: string): boolean {
  const ticketRegex = /^VTP-\d{8}-\d{4}$/;
  return ticketRegex.test(ticket);
}

