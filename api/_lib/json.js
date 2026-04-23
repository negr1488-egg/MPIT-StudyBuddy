export function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.send(JSON.stringify(body));
}

export async function readBody(request) {
  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  return {};
}
