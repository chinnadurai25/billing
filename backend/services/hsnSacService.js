const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_CATALOG_URL = 'https://raw.githubusercontent.com/vikasrami/India-HSN-SAC-Master/main/India-HSN-SAC-Master.json';
const DEFAULT_CATALOG_TTL_MS = 6 * 60 * 60 * 1000;
let defaultCatalogCache = null;
let defaultCatalogRequest = null;

const loadDefaultCatalog = async () => {
  if (defaultCatalogCache && defaultCatalogCache.expiresAt > Date.now()) return defaultCatalogCache.records;
  if (defaultCatalogRequest) return defaultCatalogRequest;

  defaultCatalogRequest = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(DEFAULT_CATALOG_URL, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Default HSN/SAC catalog returned HTTP ${response.status}`);
      const records = await response.json();
      if (!Array.isArray(records) || records.length === 0) throw new Error('Default HSN/SAC catalog returned no records.');
      defaultCatalogCache = { records, expiresAt: Date.now() + DEFAULT_CATALOG_TTL_MS };
      return records;
    } finally {
      clearTimeout(timeout);
      defaultCatalogRequest = null;
    }
  })();

  return defaultCatalogRequest;
};

const pick = (record, keys) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && String(record[key]).trim()) {
      return record[key];
    }
  }
  return '';
};

export const normalizeHsnSacResults = (payload, requestedType) => {
  const records = Array.isArray(payload)
    ? payload
    : (payload?.results || payload?.items || payload?.data || payload?.codes || []);
  const list = Array.isArray(records) ? records : (records && typeof records === 'object' ? [records] : []);

  return list.map((record) => {
    if (typeof record === 'string') return { code: record, name: record, description: record, gstRate: null, type: requestedType };
    const code = String(pick(record, ['code', 'hsn', 'hsnCode', 'hsn_code', 'sac', 'sacCode', 'sac_code'])).trim();
    const name = String(pick(record, ['name', 'title', 'productName', 'serviceName', 'label', 'description'])).trim();
    const description = String(pick(record, ['description', 'longDescription', 'long_description', 'details']) || name).trim();
    const rawRate = pick(record, ['gstRate', 'gst_rate', 'taxPercent', 'tax_percent', 'rate', 'gst']);
    const rateNumber = rawRate === '' ? null : Number(String(rawRate).replace('%', '').trim());
    const providerType = String(pick(record, ['type', 'kind', 'classification'])).toLowerCase();
    const type = providerType.includes('sac') || providerType.includes('service') ? 'SAC'
      : providerType.includes('hsn') || providerType.includes('good') ? 'HSN' : requestedType;

    return {
      code,
      name: name || description,
      description,
      gstRate: Number.isFinite(rateNumber) && rateNumber >= 0 && rateNumber <= 100 ? rateNumber : null,
      type
    };
  }).filter((record) => record.code && record.name && record.type === requestedType);
};

export const lookupHsnSac = async ({ code, type }) => {
  const normalizedType = String(type || '').toUpperCase();
  const normalizedCode = String(code || '').trim();
  if (!['HSN', 'SAC'].includes(normalizedType)) throw new Error('type must be HSN or SAC');
  if (!/^\d{2,8}$/.test(normalizedCode)) return [];

  const cacheKey = `${normalizedType}:${normalizedCode}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.results;

  let payload;
  const providerUrl = process.env.HSN_SAC_API_URL;
  if (providerUrl) {
    const url = new URL(providerUrl);
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
      throw new Error('HSN/SAC catalog URL must use HTTPS.');
    }
    url.searchParams.set('type', normalizedType);
    url.searchParams.set('query', normalizedCode);
    url.searchParams.set('limit', '10');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const headers = { Accept: 'application/json' };
      if (process.env.HSN_SAC_API_KEY) headers.Authorization = `Bearer ${process.env.HSN_SAC_API_KEY}`;
      const response = await fetch(url, { headers, signal: controller.signal });
      if (!response.ok) throw new Error(`HSN/SAC catalog returned HTTP ${response.status}`);
      payload = await response.json();
    } finally {
      clearTimeout(timeout);
    }
  } else {
    payload = await loadDefaultCatalog();
  }

  const results = normalizeHsnSacResults(payload, normalizedType)
    .filter((record) => record.code.startsWith(normalizedCode))
    .slice(0, 10);
  cache.set(cacheKey, { results, expiresAt: Date.now() + CACHE_TTL_MS });
  return results;
};

export const verifyHsnSac = async ({ code, type }) => {
  const results = await lookupHsnSac({ code, type });
  const normalizedCode = String(code || '').trim();
  return results.find((record) => record.code === normalizedCode) || null;
};
