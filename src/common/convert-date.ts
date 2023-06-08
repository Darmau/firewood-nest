export default function convertDate(input) {
  var htmlEntities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#43;': '+'
  };
  
  const decodedString = input.replace(/&(amp|lt|gt|quot|#43);/g, function(match) {
    return htmlEntities[match];
  });

  const date = new Date(decodedString);
  date.setUTCHours(date.getUTCHours() - 8);

  return date;
}