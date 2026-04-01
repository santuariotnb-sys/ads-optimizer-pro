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
      let errorMessage = `Erro ${response.status} na API do Meta`;
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch {
        // Response não é JSON (ex: HTML error page)
      }
      throw new Error(errorMessage);
    }

    const data = await response.json() as T;
    this.setCache(cacheKey, data);
    return data;
  }

  /** POST with form-urlencoded (Meta Graph API standard for mutations) */
  private async post<T>(endpoint: string, params: Record<string, string | number | boolean>): Promise<T> {
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit atingido (200/hora).');
    }
    const url = `${BASE_URL}/${API_VERSION}/${endpoint}`;
    const body = new URLSearchParams();
    body.append('access_token', this.accessToken);
    Object.entries(params).forEach(([k, v]) => body.append(k, String(v)));

    this.requestCount++;
    const response = await fetch(url, { method: 'POST', body });
    const data = await response.json() as T & { error?: { message: string } };
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || `Erro ${response.status}`);
    }
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

  /** Fetch ad accounts the user has access to */
  async fetchAdAccounts(): Promise<{ data: { id: string; name: string; account_status: number; currency: string }[] }> {
    return this.request('me/adaccounts?fields=id,name,account_status,currency&limit=50');
  }

  /** Fetch Facebook Pages with profile picture */
  async fetchPagesWithPicture(): Promise<{ data: { id: string; name: string; picture: { data: { url: string } } }[] }> {
    return this.request('me/accounts?fields=id,name,picture&limit=50');
  }

  /** Fetch active campaigns for the ad account */
  async fetchCampaignsList(): Promise<{ data: { id: string; name: string; status: string; objective: string }[] }> {
    return this.request(`act_${this.adAccountId}/campaigns?fields=id,name,status,objective&limit=100&filtering=[{"field":"effective_status","operator":"IN","value":["ACTIVE","PAUSED"]}]`);
  }

  /** Fetch ad sets for a campaign */
  async fetchAdSetsList(campaignId: string): Promise<{ data: { id: string; name: string; status: string; daily_budget: string }[] }> {
    return this.request(`${campaignId}/adsets?fields=id,name,status,daily_budget&limit=100`);
  }

  /** Fetch ads for an ad set (for duplication) */
  async fetchAdsList(adSetId: string): Promise<{ data: { id: string; name: string; status: string; creative: { id: string } }[] }> {
    return this.request(`${adSetId}/ads?fields=id,name,status,creative{id,name,thumbnail_url}&limit=100`);
  }

  /** Duplicate an ad with a new creative */
  async duplicateAd(params: {
    adset_id: string;
    name: string;
    creative_id: string;
    status?: string;
  }): Promise<{ id: string }> {
    return this.post(`act_${this.adAccountId}/ads`, {
      name: params.name,
      adset_id: params.adset_id,
      creative: JSON.stringify({ creative_id: params.creative_id }),
      status: params.status || 'PAUSED',
    });
  }

  /** Create campaign (PAUSED by default for safety) */
  async createCampaign(params: {
    name: string;
    objective: string;
    status?: string;
    special_ad_categories?: string[];
    daily_budget?: number;
  }): Promise<{ id: string }> {
    return this.post(`act_${this.adAccountId}/campaigns`, {
      name: params.name,
      objective: params.objective,
      status: params.status || 'PAUSED',
      special_ad_categories: JSON.stringify(params.special_ad_categories || []),
      is_adset_budget_sharing_enabled: false,
      ...(params.daily_budget ? { daily_budget: params.daily_budget } : {}),
    });
  }

  /** Create ad set under a campaign */
  async createAdSet(params: {
    campaign_id: string;
    name: string;
    optimization_goal: string;
    billing_event: string;
    daily_budget: number;
    targeting: Record<string, unknown>;
    status?: string;
  }): Promise<{ id: string }> {
    return this.post(`act_${this.adAccountId}/adsets`, {
      campaign_id: params.campaign_id,
      name: params.name,
      optimization_goal: params.optimization_goal,
      billing_event: params.billing_event,
      daily_budget: params.daily_budget,
      targeting: JSON.stringify(params.targeting),
      status: params.status || 'PAUSED',
    });
  }

  /** Upload image and get hash */
  async uploadImage(file: File): Promise<{ hash: string }> {
    if (!this.checkRateLimit()) throw new Error('Rate limit atingido.');

    const url = `${BASE_URL}/${API_VERSION}/act_${this.adAccountId}/adimages`;
    const formData = new FormData();
    formData.append('access_token', this.accessToken);
    formData.append('filename', file);

    this.requestCount++;
    const response = await fetch(url, { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Falha no upload da imagem');
    }
    // Response format: { images: { filename: { hash: "abc123" } } }
    const images = data.images as Record<string, { hash: string }>;
    const firstKey = Object.keys(images)[0];
    return { hash: images[firstKey].hash };
  }

  /** Create ad creative with image hash */
  async createAdCreative(params: {
    name: string;
    image_hash: string;
    page_id: string;
    message?: string;
    link?: string;
  }): Promise<{ id: string }> {
    const objectStorySpec: Record<string, unknown> = {
      page_id: params.page_id,
      link_data: {
        image_hash: params.image_hash,
        message: params.message || '',
        link: params.link || '',
      },
    };
    return this.post(`act_${this.adAccountId}/adcreatives`, {
      name: params.name,
      object_story_spec: JSON.stringify(objectStorySpec),
    });
  }

  /** Create ad linking creative to ad set */
  async createAd(params: {
    name: string;
    adset_id: string;
    creative_id: string;
    status?: string;
  }): Promise<{ id: string }> {
    return this.post(`act_${this.adAccountId}/ads`, {
      name: params.name,
      adset_id: params.adset_id,
      creative: JSON.stringify({ creative_id: params.creative_id }),
      status: params.status || 'PAUSED',
    });
  }

  async updateBudget(objectId: string, dailyBudget: number) {
    return this.post(objectId, { daily_budget: Math.round(dailyBudget * 100) });
  }

  async updateStatus(objectId: string, status: 'ACTIVE' | 'PAUSED') {
    return this.post(objectId, { status });
  }

  /** Fetch Facebook Pages the user manages (needed for ad creative) */
  async fetchPages(): Promise<{ data: { id: string; name: string }[] }> {
    return this.request('me/accounts?fields=id,name&limit=50');
  }
}
