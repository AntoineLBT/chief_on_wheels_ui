export function formatPrice(value: number) {
  return `${value.toFixed(2)} €`;
}

export function formatCoefficient(value: number | null) {
  return value === null ? "—" : `×${value.toFixed(2)}`;
}
