import { getRequest } from '@tanstack/react-start/server';
import { auth } from './auth';

export const getInternalSession = () => {
  const request = getRequest();
  if (!request?.headers) {
    return null;
  }

  return auth.api.getSession({
    headers: request.headers,
  });
};
