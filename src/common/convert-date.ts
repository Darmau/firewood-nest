export default function convertToISOString(dateString) {
  if(!dateString) return new Date().toISOString();
  const isoDate = new Date(dateString).toISOString();
  return new Date(isoDate);
}