export const generatePdfFromDocx = async (blob: Blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  const response = await fetch("/api/convert-docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: base64 }),
  });

  if (!response.ok) throw new Error("Ошибка конвертации");

  const pdfBlob = await response.blob();
  return URL.createObjectURL(pdfBlob);
};
