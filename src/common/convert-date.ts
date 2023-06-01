export default function convertToISOString(dateString) {
  const isoDate = new Date(dateString).toISOString();
  return new Date(isoDate);
}