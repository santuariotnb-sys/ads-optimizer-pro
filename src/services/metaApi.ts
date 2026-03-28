const API_VERSION = 'v21.0';
const BASE_URL = 'https://graph.facebook.com';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 min
const RATE_LIMIT = 200; // per hour

export class MetaApiService {
  private accessToken: string;
  private adAccountId: string;
  private cache = new Map<string, CacheEntry<unknown>>();
  private requestCount = 0;
  private requestWindowStart = Date.now();

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.requestWindowStart > 3600000) {
      this.requestCount = 0;
      this.requestWindowStart = now;
    }
    return this.requestCount < RATE_LIMIT;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit atingido (200/hora). Aguarde antes de fazer novas requisições.');
    }

    const cacheKey = `${options?.method || 'GET'}:${endpoint}`;
    if (!options?.method || options.method === 'GET') {
      const cached = this.getCached<T>(cacheKey);
      if (cached) return cached;
    }

    const url = `${BASE_URL}/${API_VERSION}/${endpoint}`;
    const separator = endpoint.includes('?') ? '&' : '?';
    const fullUrl = `${url}${separator}access_token=${this.accessToken}`;

    this.requestCount++;
    const response = await fetch(fullUrl, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro na API do Meta');
    }

    const data = await response.json() as T;
    this.setCache(cacheKey, data);
    return data;
  }

  async fetchCampaigns() {
    return this.request(`act_${this.adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time`);
  }

  async fetchAdSets(campaignId: string) {
    return this.request(`${campaignId}/adsets?fields=id,name,status,optimization_goal,daily_budget,targeting`);
  }

  async fetchAds(adSetId: string) {
    return this.request(`${adSetId}/ads?fields=id,name,status,creative`);
  }

  async fetchInsights(objectId: string, fields: string, datePreset: string) {
    return this.request(`${objectId}/insights?fields=${fields}&date_preset=${datePreset}`);
  }

  async fetchCreatives(adId: string) {
    return this.request(`${adId}/adcreatives?fields=id,name,thumbnail_url,image_hash`);
  }

  async fetchAudiences() {
    return this.request(`act_${this.adAccountId}/customaudiences?fields=id,name,approximate_count`);
  }

  async createCampaign(params: Record<string, unknown>) {
    return this.request(`act_${this.adAccountId}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  async createAdSet(campaignId: string, params: Record<string, unknown>) {
    return this.request(`${campaignId}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  async createAd(adSetId: string, params: Record<string, unknown>) {
    return this.request(`${adSetId}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  async updateBudget(objectId: string, dailyBudget: number) {
    return this.request(objectId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_budget: Math.round(dailyBudget * 100) }),
    });
  }

  async updateStatus(objectId: string, status: 'ACTIVE' | 'PAUSED') {
    return this.request(objectId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  async sendCAPIEvent(pixelId: string, events: unknown[]) {
    return this.request(`${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: events }),
    });
  }
}
