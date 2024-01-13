export default function convertDate(dateString: Date) {
  let date = new Date(dateString);

  // 如果转换的日期超过当前日期或者没有日期，则返回当前时间
  if (date.getTime() > Date.now() || isNaN(date.getTime())) {
    date = new Date(Date.now());
  }

  return date;
}
