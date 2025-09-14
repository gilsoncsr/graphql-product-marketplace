/**
 * Utilitários de validação para formulários e dados
 */

/**
 * Valida se um email é válido
 * @param email - Email para validar
 * @returns true se o email for válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida se uma senha é forte o suficiente
 * @param password - Senha para validar
 * @returns true se a senha for válida
 */
export const isValidPassword = (password: string): boolean => {
  // Pelo menos 6 caracteres
  return password.length >= 6;
};

/**
 * Valida se um telefone brasileiro é válido
 * @param phone - Telefone para validar (formato: (11) 99999-9999)
 * @returns true se o telefone for válido
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * Valida se um CPF é válido
 * @param cpf - CPF para validar
 * @returns true se o CPF for válido
 */
export const isValidCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

/**
 * Valida se um CEP é válido
 * @param cep - CEP para validar
 * @returns true se o CEP for válido
 */
export const isValidCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8;
};

/**
 * Valida se uma URL é válida
 * @param url - URL para validar
 * @returns true se a URL for válida
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Valida se um valor não está vazio
 * @param value - Valor para validar
 * @returns true se o valor não estiver vazio
 */
export const isNotEmpty = (value: string | number | null | undefined): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  return true;
};

/**
 * Valida se um valor está dentro de um range
 * @param value - Valor para validar
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns true se o valor estiver dentro do range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Valida se uma string tem o comprimento correto
 * @param value - String para validar
 * @param minLength - Comprimento mínimo
 * @param maxLength - Comprimento máximo
 * @returns true se a string tiver o comprimento correto
 */
export const hasValidLength = (value: string, minLength: number, maxLength: number): boolean => {
  return value.length >= minLength && value.length <= maxLength;
};

/**
 * Valida se um valor é um número válido
 * @param value - Valor para validar
 * @returns true se o valor for um número válido
 */
export const isValidNumber = (value: string | number): boolean => {
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') return !isNaN(Number(value)) && isFinite(Number(value));
  return false;
};

/**
 * Valida se um valor é um número inteiro
 * @param value - Valor para validar
 * @returns true se o valor for um número inteiro
 */
export const isValidInteger = (value: string | number): boolean => {
  if (typeof value === 'number') return Number.isInteger(value);
  if (typeof value === 'string') {
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num);
  }
  return false;
};

/**
 * Valida se um valor é um número positivo
 * @param value - Valor para validar
 * @returns true se o valor for um número positivo
 */
export const isPositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? Number(value) : value;
  return !isNaN(num) && num > 0;
};

/**
 * Valida se um valor é um número não negativo
 * @param value - Valor para validar
 * @returns true se o valor for um número não negativo
 */
export const isNonNegativeNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? Number(value) : value;
  return !isNaN(num) && num >= 0;
};

/**
 * Valida se uma data é válida
 * @param date - Data para validar
 * @returns true se a data for válida
 */
export const isValidDate = (date: string | Date): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Valida se uma data é futura
 * @param date - Data para validar
 * @returns true se a data for futura
 */
export const isFutureDate = (date: string | Date): boolean => {
  const d = new Date(date);
  const now = new Date();
  return d > now;
};

/**
 * Valida se uma data é passada
 * @param date - Data para validar
 * @returns true se a data for passada
 */
export const isPastDate = (date: string | Date): boolean => {
  const d = new Date(date);
  const now = new Date();
  return d < now;
};

/**
 * Valida se um valor está em uma lista de valores permitidos
 * @param value - Valor para validar
 * @param allowedValues - Lista de valores permitidos
 * @returns true se o valor estiver na lista
 */
export const isInAllowedValues = <T>(value: T, allowedValues: T[]): boolean => {
  return allowedValues.includes(value);
};

/**
 * Valida se um objeto tem todas as propriedades obrigatórias
 * @param obj - Objeto para validar
 * @param requiredKeys - Lista de chaves obrigatórias
 * @returns true se o objeto tiver todas as propriedades obrigatórias
 */
export const hasRequiredKeys = (obj: Record<string, any>, requiredKeys: string[]): boolean => {
  return requiredKeys.every(key => key in obj && obj[key] !== null && obj[key] !== undefined);
};

/**
 * Valida se um array não está vazio
 * @param arr - Array para validar
 * @returns true se o array não estiver vazio
 */
export const isNonEmptyArray = (arr: any[]): boolean => {
  return Array.isArray(arr) && arr.length > 0;
};

/**
 * Valida se um valor é um boolean
 * @param value - Valor para validar
 * @returns true se o valor for um boolean
 */
export const isBoolean = (value: any): value is boolean => {
  return typeof value === 'boolean';
};

/**
 * Valida se um valor é uma string
 * @param value - Valor para validar
 * @returns true se o valor for uma string
 */
export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

/**
 * Valida se um valor é um número
 * @param value - Valor para validar
 * @returns true se o valor for um número
 */
export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Valida se um valor é um objeto
 * @param value - Valor para validar
 * @returns true se o valor for um objeto
 */
export const isObject = (value: any): value is object => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Valida se um valor é um array
 * @param value - Valor para validar
 * @returns true se o valor for um array
 */
export const isArray = (value: any): value is any[] => {
  return Array.isArray(value);
};
