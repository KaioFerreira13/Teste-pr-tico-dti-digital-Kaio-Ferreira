export const AUTH_FIELD_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  password: { min: 8, max: 72 },
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = email => {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) return 'Informe o email.';
  if (normalizedEmail.length > AUTH_FIELD_LIMITS.email.max) {
    return `O email deve ter no maximo ${AUTH_FIELD_LIMITS.email.max} caracteres.`;
  }
  if (!emailPattern.test(normalizedEmail)) return 'Informe um email valido.';
  return '';
};

export const validatePasswordLength = password => {
  if (!password) return 'Informe a senha.';
  if (password.length > AUTH_FIELD_LIMITS.password.max) {
    return `A senha deve ter no maximo ${AUTH_FIELD_LIMITS.password.max} caracteres.`;
  }
  return '';
};

export const getPasswordRequirements = password => [
  {
    label: `Pelo menos ${AUTH_FIELD_LIMITS.password.min} caracteres`,
    valid: password.length >= AUTH_FIELD_LIMITS.password.min,
  },
  { label: 'Uma letra maiuscula', valid: /[A-Z]/.test(password) },
  { label: 'Uma letra minuscula', valid: /[a-z]/.test(password) },
  { label: 'Um numero', valid: /\d/.test(password) },
  { label: 'Um caractere especial', valid: /[^A-Za-z0-9\s]/.test(password) },
];

export const validateLogin = ({ email, password }) =>
  validateEmail(email) || validatePasswordLength(password);

export const validateRegistration = ({ name, email, password }) => {
  const normalizedName = name.trim();
  if (normalizedName.length < AUTH_FIELD_LIMITS.name.min) {
    return `O nome deve ter pelo menos ${AUTH_FIELD_LIMITS.name.min} caracteres.`;
  }
  if (normalizedName.length > AUTH_FIELD_LIMITS.name.max) {
    return `O nome deve ter no maximo ${AUTH_FIELD_LIMITS.name.max} caracteres.`;
  }

  const emailError = validateEmail(email);
  if (emailError) return emailError;

  const passwordLengthError = validatePasswordLength(password);
  if (passwordLengthError) return passwordLengthError;

  const unmetRequirement = getPasswordRequirements(password).find(item => !item.valid);
  return unmetRequirement
    ? `A senha precisa conter: ${unmetRequirement.label.toLowerCase()}.`
    : '';
};

