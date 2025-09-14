/**
 * Utilitários de formatação para dados e strings
 */

/**
 * Formata um valor monetário para o padrão brasileiro
 * @param value - Valor numérico para formatar
 * @param currency - Moeda (padrão: 'BRL')
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export const formatCurrency = (value: number, currency: string = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
};

/**
 * Formata um valor monetário sem símbolo da moeda
 * @param value - Valor numérico para formatar
 * @returns String formatada (ex: "1.234,56")
 */
export const formatCurrencyValue = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formata um número para o padrão brasileiro
 * @param value - Valor numérico para formatar
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada (ex: "1.234,56")
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formata um número inteiro para o padrão brasileiro
 * @param value - Valor numérico para formatar
 * @returns String formatada (ex: "1.234")
 */
export const formatInteger = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Formata uma data para o padrão brasileiro
 * @param date - Data para formatar
 * @param options - Opções de formatação
 * @returns String formatada (ex: "15/03/2024")
 */
export const formatDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
): string => {
  return new Intl.DateTimeFormat('pt-BR', options).format(new Date(date));
};

/**
 * Formata uma data e hora para o padrão brasileiro
 * @param date - Data para formatar
 * @returns String formatada (ex: "15/03/2024 14:30")
 */
export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Formata uma data para formato longo
 * @param date - Data para formatar
 * @returns String formatada (ex: "15 de março de 2024")
 */
export const formatDateLong = (date: string | Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Formata um telefone brasileiro
 * @param phone - Telefone para formatar
 * @returns String formatada (ex: "(11) 99999-9999")
 */
export const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

/**
 * Formata um CPF
 * @param cpf - CPF para formatar
 * @returns String formatada (ex: "123.456.789-00")
 */
export const formatCPF = (cpf: string): string => {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

/**
 * Formata um CEP
 * @param cep - CEP para formatar
 * @returns String formatada (ex: "12345-678")
 */
export const formatCEP = (cep: string): string => {
  const numbers = cep.replace(/\D/g, '');
  
  if (numbers.length <= 5) return numbers;
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
};

/**
 * Formata um CNPJ
 * @param cnpj - CNPJ para formatar
 * @returns String formatada (ex: "12.345.678/0001-90")
 */
export const formatCNPJ = (cnpj: string): string => {
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
};

/**
 * Formata um nome próprio (primeira letra maiúscula)
 * @param name - Nome para formatar
 * @returns String formatada (ex: "João Silva")
 */
export const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formata um texto para título (primeira letra de cada palavra maiúscula)
 * @param text - Texto para formatar
 * @returns String formatada (ex: "Título Do Texto")
 */
export const formatTitle = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formata um texto para slug (URL-friendly)
 * @param text - Texto para formatar
 * @returns String formatada (ex: "titulo-do-texto")
 */
export const formatSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
};

/**
 * Formata um texto para camelCase
 * @param text - Texto para formatar
 * @returns String formatada (ex: "tituloDoTexto")
 */
export const formatCamelCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
};

/**
 * Formata um texto para PascalCase
 * @param text - Texto para formatar
 * @returns String formatada (ex: "TituloDoTexto")
 */
export const formatPascalCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

/**
 * Formata um texto para snake_case
 * @param text - Texto para formatar
 * @returns String formatada (ex: "titulo_do_texto")
 */
export const formatSnakeCase = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};

/**
 * Formata um texto para kebab-case
 * @param text - Texto para formatar
 * @returns String formatada (ex: "titulo-do-texto")
 */
export const formatKebabCase = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

/**
 * Formata um texto truncando com reticências
 * @param text - Texto para formatar
 * @param maxLength - Comprimento máximo
 * @returns String formatada (ex: "Texto muito longo...")
 */
export const formatTruncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Formata um texto para maiúsculas
 * @param text - Texto para formatar
 * @returns String formatada (ex: "TEXTO EM MAIÚSCULAS")
 */
export const formatUpperCase = (text: string): string => {
  return text.toUpperCase();
};

/**
 * Formata um texto para minúsculas
 * @param text - Texto para formatar
 * @returns String formatada (ex: "texto em minúsculas")
 */
export const formatLowerCase = (text: string): string => {
  return text.toLowerCase();
};

/**
 * Formata um texto para capitalizar apenas a primeira letra
 * @param text - Texto para formatar
 * @returns String formatada (ex: "Texto em minúsculas")
 */
export const formatCapitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Formata um texto removendo espaços extras
 * @param text - Texto para formatar
 * @returns String formatada (ex: "texto sem espaços extras")
 */
export const formatTrim = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};

/**
 * Formata um texto removendo quebras de linha
 * @param text - Texto para formatar
 * @returns String formatada (ex: "texto sem quebras de linha")
 */
export const formatSingleLine = (text: string): string => {
  return text.replace(/\n/g, ' ').replace(/\r/g, '');
};

/**
 * Formata um texto para HTML (escapando caracteres especiais)
 * @param text - Texto para formatar
 * @returns String formatada (ex: "&lt;script&gt;alert('xss')&lt;/script&gt;")
 */
export const formatHtmlEscape = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Formata um texto para URL (encoding)
 * @param text - Texto para formatar
 * @returns String formatada (ex: "texto%20com%20espaços")
 */
export const formatUrlEncode = (text: string): string => {
  return encodeURIComponent(text);
};

/**
 * Formata um texto para URL (decoding)
 * @param text - Texto para formatar
 * @returns String formatada (ex: "texto com espaços")
 */
export const formatUrlDecode = (text: string): string => {
  return decodeURIComponent(text);
};

/**
 * Formata um texto para base64
 * @param text - Texto para formatar
 * @returns String formatada (ex: "dGV4dG8gZW0gYmFzZTY0")
 */
export const formatBase64 = (text: string): string => {
  return btoa(text);
};

/**
 * Formata um texto de base64
 * @param text - Texto para formatar
 * @returns String formatada (ex: "texto em base64")
 */
export const formatFromBase64 = (text: string): string => {
  return atob(text);
};

/**
 * Formata um texto para hash (simples)
 * @param text - Texto para formatar
 * @returns String formatada (ex: "a1b2c3d4e5f6")
 */
export const formatHash = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Formata um texto para UUID (simples)
 * @returns String formatada (ex: "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
 */
export const formatUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Formata um texto para timestamp
 * @param date - Data para formatar (padrão: agora)
 * @returns String formatada (ex: "1640995200000")
 */
export const formatTimestamp = (date: Date = new Date()): string => {
  return date.getTime().toString();
};

/**
 * Formata um texto para timestamp Unix
 * @param date - Data para formatar (padrão: agora)
 * @returns String formatada (ex: "1640995200")
 */
export const formatUnixTimestamp = (date: Date = new Date()): string => {
  return Math.floor(date.getTime() / 1000).toString();
};

/**
 * Formata um texto para timestamp ISO
 * @param date - Data para formatar (padrão: agora)
 * @returns String formatada (ex: "2024-01-01T00:00:00.000Z")
 */
export const formatISOTimestamp = (date: Date = new Date()): string => {
  return date.toISOString();
};

/**
 * Formata um texto para timestamp RFC
 * @param date - Data para formatar (padrão: agora)
 * @returns String formatada (ex: "Mon, 01 Jan 2024 00:00:00 GMT")
 */
export const formatRFCTimestamp = (date: Date = new Date()): string => {
  return date.toUTCString();
};
