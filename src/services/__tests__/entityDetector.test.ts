import { describe, it, expect } from 'vitest';
import { analyzeCreativeSimilarity, getOvercrowdedEntities, suggestDiversification } from '../entityDetector';
import type { Creative } from '../../types/meta';

const makeCreative = (id: string, group: number, name: string): Creative => ({
  id, name, thumbnail_url: '', image_hash: `hash_${id}`,
  entity_id_group: group, hook_rate: 30, hold_rate: 40,
  thumbstop_ratio: 25, ctr: 2, cpc: 1.5, cpa: 50, cpm: 35,
  score: 70, status: 'testing', novelty_days: 3, cpm_trend: [35],
  impressions: 10000, spend: 500,
});

describe('analyzeCreativeSimilarity', () => {
  it('groups creatives by entity_id_group', () => {
    const creatives = [
      makeCreative('1', 1, 'VSL A'),
      makeCreative('2', 1, 'VSL B'),
      makeCreative('3', 2, 'Static A'),
    ];
    const groups = analyzeCreativeSimilarity(creatives);
    expect(groups).toHaveLength(2);
    expect(groups.find(g => g.entity_id === 1)?.creatives).toHaveLength(2);
  });

  it('calculates total spend per group', () => {
    const creatives = [
      makeCreative('1', 1, 'A'),
      makeCreative('2', 1, 'B'),
    ];
    const groups = analyzeCreativeSimilarity(creatives);
    expect(groups[0].total_spend).toBe(1000);
  });

  it('flags overcrowded groups', () => {
    const creatives = [
      makeCreative('1', 1, 'A'), makeCreative('2', 1, 'B'),
      makeCreative('3', 1, 'C'), makeCreative('4', 1, 'D'),
    ];
    const groups = analyzeCreativeSimilarity(creatives);
    expect(groups[0].is_overcrowded).toBe(true);
  });
});

describe('getOvercrowdedEntities', () => {
  it('filters only overcrowded', () => {
    const creatives = [
      makeCreative('1', 1, 'A'), makeCreative('2', 1, 'B'),
      makeCreative('3', 1, 'C'), makeCreative('4', 1, 'D'),
      makeCreative('5', 2, 'E'),
    ];
    const groups = analyzeCreativeSimilarity(creatives);
    const overcrowded = getOvercrowdedEntities(groups);
    expect(overcrowded).toHaveLength(1);
    expect(overcrowded[0].entity_id).toBe(1);
  });
});

describe('suggestDiversification', () => {
  it('suggests adding missing formats', () => {
    const creatives = [makeCreative('1', 1, 'Static A')];
    const groups = analyzeCreativeSimilarity(creatives);
    const suggestions = suggestDiversification(groups);
    expect(suggestions.some(s => s.includes('UGC'))).toBe(true);
  });
});
