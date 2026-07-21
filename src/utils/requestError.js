export function getBusinessErrorKey(value) {
  return (
    value?.errorKey ??
    value?.data?.errorKey ??
    value?.data?.data?.errorKey ??
    value?.response?.data?.errorKey ??
    value?.response?.data?.data?.errorKey ??
    null
  );
}

export function createBusinessError(response) {
  const data = response?.data ?? {};
  const error = new Error(data.msg || "Request failed");
  error.response = response;
  error.data = data;
  error.errorKey = getBusinessErrorKey(data);
  return error;
}
