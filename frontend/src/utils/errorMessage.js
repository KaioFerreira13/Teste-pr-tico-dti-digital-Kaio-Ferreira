export const getErrorMessage = (error, fallback = 'Nao foi possivel concluir a operacao.') => {
  const data = error?.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (data.message && data.fields && typeof data.fields === 'object') {
    const fieldMessages = Object.values(data.fields).filter(Boolean);
    return fieldMessages.length > 0 ? fieldMessages.join(' ') : data.message;
  }

  if (data.message) {
    return data.message;
  }

  return fallback;
};
