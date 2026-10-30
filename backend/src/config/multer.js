import multer from "multer";

// Os arquivos de documentos e anexos ficam no banco (tabela StoredFile), porque o
// disco do servidor gratuito é apagado a cada deploy. Por isso o upload fica na
// memória e tem limite de tamanho, para não encher o banco gratuito.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export default multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});
