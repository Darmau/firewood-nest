export default function sliceString(str: string, bytes: number) {
  const buffer = Buffer.from(str, "utf8");
  if (buffer.byteLength <= bytes) {
    return str;
  }
  const slice = buffer.subarray(0, bytes);
  return slice.toString("utf8");
}
