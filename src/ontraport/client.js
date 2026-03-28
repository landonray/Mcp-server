const { fromHttpStatus, rateLimited } = require('../errors');

const BASE_URL = 'https://api.ontraport.com/1';

class OntraportClient {
  constructor(apiKey, appId) {
    this.apiKey = apiKey;
    this.appId = appId;
  }

  _headers() {
    return {
      'Api-Key': this.apiKey,
      'Api-Appid': this.appId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  async _request(method, path, { params, body } = {}) {
    let url = `${BASE_URL}${path}`;

    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          qs.append(key, String(value));
        }
      }
      const qsStr = qs.toString();
      if (qsStr) {
        url += `?${qsStr}`;
      }
    }

    const fetchOptions = {
      method,
      headers: this._headers(),
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const err = rateLimited(retryAfter);
      throw err;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        throw fromHttpStatus(response.status, `Ontraport API returned HTTP ${response.status} with non-JSON body.`);
      }
      data = {};
    }

    if (!response.ok) {
      const message = data?.message || data?.error || `Ontraport API error (HTTP ${response.status})`;
      throw fromHttpStatus(response.status, message);
    }

    return data;
  }

  async get(path, params) {
    return this._request('GET', path, { params });
  }

  async post(path, body) {
    return this._request('POST', path, { body });
  }

  async put(path, body) {
    return this._request('PUT', path, { body });
  }

  async delete(path, { params, body } = {}) {
    return this._request('DELETE', path, { params, body });
  }
}

module.exports = { OntraportClient };
