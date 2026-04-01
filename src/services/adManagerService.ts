/**
 * Ad Manager Service
 * Orquestra todas as integrações necessárias para criação segura de campanhas:
 * Meta API, Alert Engine, AutoScale, Entity Detector, Signal Gateway, Agent IA
 */
import { MetaApiService } from './metaApi';
import { evaluateAlerts } from './alertEngine';
import { evaluateAutoScale } from './autoScaler';
import { analyzeCreativeSimilarity, getOvercrowdedEntities } from './entityDetector';
import { AUTO_SCALE, MAX_CREATIVES_PER_ENTITY } from '../utils/constants';
import type { Campaign, Creative, Audience } from '../types/meta';

// ─── Types ──────────────────────────────────────────────────────────────

export interface AdManagerCampaignForm {
  name: string;
  objective: string;
  bidStrategy: string;
  budgetType: 'daily' | 'lifetime';
  budget: number;
  specialCategories: string[];
}

export interface AdManagerAdSetForm {
  name: string;
  campaignId: string;
  optimizationGoal: string;
  conversionLocation: string;
  pixelId: string;
  conversionEvent: string;
  attributionWindow: string;
  performanceGoal: string;
  budgetType: 'daily' | 'lifetime';
  budget: number;
  scheduleStart: string;
  scheduleEnd: string;
  targeting: {
    type: 'advantage_plus' | 'manual';
    countries: string[];
    ageMin: number;
    ageMax: number;
    genders: number[];
    customAudiences: { id: string; name: string }[];
    excludedAudiences: { id: string; name: string }[];
  };
  placements: 'advantage' | 'manual';
  manualPlacements?: string[];
}

export interface AdManagerAdForm {
  name: string;
  adSetId: string;
  pageId: string;
  instagramAccountId: string;
  creativeType: 'new' | 'existing_post';
  existingPostId: string;
  format: 'image' | 'video' | 'carousel';
  media: File | null;
  primaryText: string;
  headline: string;
  description: string;
  ctaType: string;
  destinationUrl: string;
  displayUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  trackingPixelId: string;
}

export interface SafetyCheckResult {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface AIInsight {
  type: 'suggestion' | 'warning' | 'optimization';
  title: string;
  message: string;
  confidence: number;
}

export interface CreationResult {
  success: boolean;
  campaignId?: string;
  adSetId?: string;
  adId?: string;
  creativeId?: string;
  error?: string;
  warnings: string[];
}

// ─── Safety Checks ─────────────────────────────────────────────────────

export function runSafetyChecks(
  campaignForm: AdManagerCampaignForm,
  adSetForm: AdManagerAdSetForm,
  adForm: AdManagerAdForm,
  campaigns: Campaign[],
  creatives: Creative[],
): SafetyCheckResult[] {
  const checks: SafetyCheckResult[] = [];

  // 1. Budget dentro do limite de segurança (AutoScale: max +10%)
  const existingBudgets = campaigns
    .filter(c => c.status === 'ACTIVE')
    .map(c => c.daily_budget);
  const avgBudget = existingBudgets.length > 0
    ? existingBudgets.reduce((a, b) => a + b, 0) / existingBudgets.length
    : 0;

  if (avgBudget > 0 && adSetForm.budget > avgBudget * (1 + AUTO_SCALE.MAX_BUDGET_CHANGE_PCT / 100) * 2) {
    checks.push({
      id: 'budget_safety',
      label: 'Budget Safety',
      status: 'warn',
      message: `Budget R$ ${adSetForm.budget} é ${(adSetForm.budget / avgBudget).toFixed(1)}x a média das campanhas ativas (R$ ${avgBudget.toFixed(0)}). Considere iniciar com valor menor.`,
    });
  } else {
    checks.push({
      id: 'budget_safety',
      label: 'Budget Safety',
      status: 'pass',
      message: 'Budget dentro da faixa segura.',
    });
  }

  // 2. Entity ID overcrowding check
  if (creatives.length > 0) {
    const groups = analyzeCreativeSimilarity(creatives);
    const overcrowded = getOvercrowdedEntities(groups);
    if (overcrowded.length > 0) {
      checks.push({
        id: 'entity_overcrowding',
        label: 'Entity ID Overcrowding',
        status: 'warn',
        message: `${overcrowded.length} Entity ID(s) com mais de ${MAX_CREATIVES_PER_ENTITY} criativos. Diversifique formatos visuais.`,
      });
    } else {
      checks.push({
        id: 'entity_overcrowding',
        label: 'Entity ID Overcrowding',
        status: 'pass',
        message: `Nenhum Entity ID superlotado (máx ${MAX_CREATIVES_PER_ENTITY} por grupo).`,
      });
    }
  }

  // 3. Criação sempre em PAUSED
  checks.push({
    id: 'paused_creation',
    label: 'Criação em PAUSED',
    status: 'pass',
    message: 'Campanha será criada como PAUSADA — nunca publicada diretamente.',
  });

  // 4. Pixel/tracking configurado
  if (adForm.trackingPixelId || adForm.utmSource) {
    checks.push({
      id: 'tracking_configured',
      label: 'Rastreamento',
      status: 'pass',
      message: adForm.trackingPixelId
        ? `Pixel ${adForm.trackingPixelId} configurado${adForm.utmSource ? ' + UTMs' : ''}.`
        : 'UTMs configurados para atribuição.',
    });
  } else {
    checks.push({
      id: 'tracking_configured',
      label: 'Rastreamento',
      status: 'fail',
      message: 'Sem pixel ou UTMs configurados. Atribuição ficará comprometida.',
    });
  }

  // 5. URL de destino
  if (adForm.destinationUrl) {
    const hasUtm = adForm.destinationUrl.includes('utm_') || adForm.utmSource;
    checks.push({
      id: 'destination_url',
      label: 'URL de Destino',
      status: hasUtm ? 'pass' : 'warn',
      message: hasUtm
        ? 'URL com parâmetros UTM para atribuição.'
        : 'URL sem UTMs. Recomendado para rastreamento correto.',
    });
  } else if (adForm.creativeType === 'new') {
    checks.push({
      id: 'destination_url',
      label: 'URL de Destino',
      status: 'fail',
      message: 'URL de destino obrigatória para anúncios de tráfego/conversão.',
    });
  }

  // 6. Creative configurado
  if (adForm.media || adForm.existingPostId) {
    checks.push({
      id: 'creative_ready',
      label: 'Criativo',
      status: 'pass',
      message: adForm.media ? 'Mídia carregada para upload.' : 'Post existente selecionado.',
    });
  } else {
    checks.push({
      id: 'creative_ready',
      label: 'Criativo',
      status: 'warn',
      message: 'Nenhuma mídia selecionada. Campanha será criada sem anúncio.',
    });
  }

  // 7. Objetivo + Otimização alignment
  const objectiveOptMap: Record<string, string[]> = {
    OUTCOME_SALES: ['OFFSITE_CONVERSIONS', 'VALUE'],
    OUTCOME_LEADS: ['LEAD_GENERATION', 'OFFSITE_CONVERSIONS'],
    OUTCOME_TRAFFIC: ['LINK_CLICKS', 'LANDING_PAGE_VIEWS'],
    OUTCOME_AWARENESS: ['REACH', 'IMPRESSIONS'],
    OUTCOME_ENGAGEMENT: ['POST_ENGAGEMENT', 'PAGE_LIKES'],
  };
  const validOpts = objectiveOptMap[campaignForm.objective] || [];
  if (validOpts.length > 0 && !validOpts.includes(adSetForm.optimizationGoal)) {
    checks.push({
      id: 'objective_alignment',
      label: 'Objetivo ↔ Otimização',
      status: 'warn',
      message: `Meta de otimização "${adSetForm.optimizationGoal}" pode não ser ideal para objetivo "${campaignForm.objective}". Recomendado: ${validOpts.join(' ou ')}.`,
    });
  } else {
    checks.push({
      id: 'objective_alignment',
      label: 'Objetivo ↔ Otimização',
      status: 'pass',
      message: 'Objetivo e meta de otimização alinhados.',
    });
  }

  return checks;
}

// ─── UTM Builder ────────────────────────────────────────────────────────

export function buildDestinationUrl(baseUrl: string, utms: {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}): string {
  if (!baseUrl) return '';
  try {
    const url = new URL(baseUrl);
    if (utms.source) url.searchParams.set('utm_source', utms.source);
    if (utms.medium) url.searchParams.set('utm_medium', utms.medium);
    if (utms.campaign) url.searchParams.set('utm_campaign', utms.campaign);
    if (utms.content) url.searchParams.set('utm_content', utms.content);
    if (utms.term) url.searchParams.set('utm_term', utms.term);
    return url.toString();
  } catch {
    return baseUrl;
  }
}

// ─── Orchestrated Creation ──────────────────────────────────────────────

export async function createFullCampaign(
  api: MetaApiService,
  campaignForm: AdManagerCampaignForm,
  adSetForm: AdManagerAdSetForm,
  adForm: AdManagerAdForm,
  existingCampaignId?: string,
  existingAdSetId?: string,
): Promise<CreationResult> {
  const warnings: string[] = [];

  try {
    // 1. Campaign
    let campaignId = existingCampaignId || '';
    if (!campaignId) {
      const specialCats = campaignForm.specialCategories
        .filter(c => c !== 'Nenhuma')
        .map(c => {
          const map: Record<string, string> = {
            'Crédito': 'CREDIT',
            'Emprego': 'EMPLOYMENT',
            'Habitação': 'HOUSING',
            'Política': 'ISSUES_ELECTIONS_POLITICS',
          };
          return map[c] || c;
        });

      const campaign = await api.createCampaign({
        name: campaignForm.name,
        objective: campaignForm.objective,
        status: 'PAUSED',
        special_ad_categories: specialCats,
        ...(campaignForm.budgetType === 'daily' ? { daily_budget: Math.round(campaignForm.budget * 100) } : {}),
      });
      campaignId = campaign.id;
    }

    // 2. Ad Set
    let adSetId = existingAdSetId || '';
    if (!adSetId) {
      const countryCodes: Record<string, string> = {
        'Brasil': 'BR', 'Estados Unidos': 'US', 'Portugal': 'PT',
        'Argentina': 'AR', 'México': 'MX', 'Colômbia': 'CO',
        'Chile': 'CL', 'Peru': 'PE', 'Espanha': 'ES',
      };

      const targeting: Record<string, unknown> = {
        geo_locations: {
          countries: adSetForm.targeting.countries.map(
            c => countryCodes[c] || c.substring(0, 2).toUpperCase()
          ),
        },
        age_min: adSetForm.targeting.ageMin,
        age_max: adSetForm.targeting.ageMax,
        ...(adSetForm.targeting.genders.length > 0 &&
          !adSetForm.targeting.genders.includes(0)
          ? { genders: adSetForm.targeting.genders }
          : {}),
      };

      if (adSetForm.targeting.customAudiences.length > 0) {
        targeting.custom_audiences = adSetForm.targeting.customAudiences.map(a => ({ id: a.id }));
      }
      if (adSetForm.targeting.excludedAudiences.length > 0) {
        targeting.excluded_custom_audiences = adSetForm.targeting.excludedAudiences.map(a => ({ id: a.id }));
      }

      const adSet = await api.createAdSet({
        campaign_id: campaignId,
        name: adSetForm.name,
        optimization_goal: adSetForm.optimizationGoal,
        billing_event: 'IMPRESSIONS',
        daily_budget: Math.round(adSetForm.budget * 100),
        targeting,
        status: 'PAUSED',
      });
      adSetId = adSet.id;
    }

    // 3. Ad + Creative (optional)
    let creativeId = '';
    let adId = '';

    if (adForm.media && adForm.pageId) {
      // Upload image → create creative → create ad
      const image = await api.uploadImage(adForm.media);
      const finalUrl = buildDestinationUrl(adForm.destinationUrl, {
        source: adForm.utmSource,
        medium: adForm.utmMedium,
        campaign: adForm.utmCampaign,
        content: adForm.utmContent,
        term: adForm.utmTerm,
      });

      const creative = await api.createAdCreative({
        name: `${adForm.name || campaignForm.name} — Creative`,
        image_hash: image.hash,
        page_id: adForm.pageId,
        message: adForm.primaryText,
        link: finalUrl,
      });
      creativeId = creative.id;

      const ad = await api.createAd({
        name: adForm.name || `${campaignForm.name} — Ad`,
        adset_id: adSetId,
        creative_id: creativeId,
        status: 'PAUSED',
      });
      adId = ad.id;
    } else if (!adForm.media) {
      warnings.push('Campanha criada sem criativo. Adicione o anúncio manualmente.');
    }

    return {
      success: true,
      campaignId,
      adSetId,
      adId: adId || undefined,
      creativeId: creativeId || undefined,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao criar campanha',
      warnings,
    };
  }
}

// ─── Post-Creation Actions ──────────────────────────────────────────────

export function postCreationAlertEval(
  campaigns: Campaign[],
  emqScore: number,
) {
  return evaluateAlerts(campaigns, emqScore);
}

export function postCreationScaleCheck(
  campaigns: Campaign[],
  cpaTarget: number,
) {
  return evaluateAutoScale(campaigns, cpaTarget);
}

// ─── AI Suggestions (prompt builder) ────────────────────────────────────

export function buildAISuggestionContext(
  campaignForm: AdManagerCampaignForm,
  adSetForm: AdManagerAdSetForm,
  audiences: Audience[],
  campaigns: Campaign[],
): string {
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
  const avgCPA = activeCampaigns.length > 0
    ? activeCampaigns.reduce((s, c) => s + c.cpa, 0) / activeCampaigns.length
    : 0;
  const avgROAS = activeCampaigns.length > 0
    ? activeCampaigns.reduce((s, c) => s + c.roas, 0) / activeCampaigns.length
    : 0;

  return `
Contexto da nova campanha sendo criada:
- Nome: ${campaignForm.name}
- Objetivo: ${campaignForm.objective}
- Budget: R$ ${campaignForm.budget}/dia
- Otimização: ${adSetForm.optimizationGoal}
- Países: ${adSetForm.targeting.countries.join(', ')}
- Idade: ${adSetForm.targeting.ageMin}-${adSetForm.targeting.ageMax}

Métricas atuais da conta:
- ${activeCampaigns.length} campanhas ativas
- CPA médio: R$ ${avgCPA.toFixed(2)}
- ROAS médio: ${avgROAS.toFixed(2)}x
- ${audiences.length} públicos disponíveis

Sugira: targeting ideal, budget recomendado, tipo de criativo e otimizações.
  `.trim();
}
