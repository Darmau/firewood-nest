export default function convertDate(dateString: Date) {
  let date = new Date(dateString);

  // 如果转换的日期超过当前日期或者没有日期，则返回12小时之前的时间
  if (date.getTime() > Date.now() || isNaN(date.getTime())) {
    date = new Date(Date.now() - 12 * 60 * 60 * 1000);
  }

  return date;
}
