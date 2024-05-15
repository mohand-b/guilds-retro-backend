export function convertBufferToBase64(buffer: Buffer): string {
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}
