export function formatBs(amount: number) {
  const rounded = Math.round(amount);
  return `Bs ${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
