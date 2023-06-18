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

  let dateString = new Date(decodedString).toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
  let date = new Date(dateString);
  
  // 如果日期晚于当前时间，则将date设置为当前日期
  if (date > new Date()) {
    date = new Date();
  }
  return date;
}