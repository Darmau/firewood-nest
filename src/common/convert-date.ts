export default function convertToISOString(dateString) {
  if(!dateString) return new Date();
  const isoDate = new Date(dateString).toISOString();
  return new Date(isoDate);
}