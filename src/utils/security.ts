import path from 'path';

/**
 * Sanitiza o nome de arquivo para uso em cabeçalhos HTTP Content-Disposition.
 * - Remove delimitadores de caminho (prevenção de path traversal: ../, /, \)
 * - Remove caracteres de controle de cabeçalho HTTP (\r, \n) para prevenir Header Injection / Response Splitting
 * - Permite apenas caracteres alfanuméricos seguros, pontos, traços e underscores.
 */
export function sanitizeFilename(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'skill-forge-export.zip';
  }

  // Remove caminhos relativos ou absolutos
  const baseName = path.basename(fileName);

  // Remove caracteres de injeção CRLF
  const semCrlf = baseName.replace(/[\r\n\t]/g, '');

  // Substitui qualquer caractere potencialmente perigoso por underscore
  const limpo = semCrlf.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Garante que o nome não seja vazio e não comece com ponto
  const finalName = limpo.replace(/^\.+/, '');
  return finalName || 'export.zip';
}
