export default function convertToDate(dateString) {
  if(!dateString) return new Date();
  return new Date(dateString);
}