import { Response } from 'express';

export function createMockRequest(overrides?: Record<string, unknown>) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  } as never;
}

export function createMockResponse() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value;
      return res;
    },
    getJsonBody() {
      return res.body;
    },
  };
  return res as unknown as Response;
}
