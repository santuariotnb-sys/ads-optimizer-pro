import type { Creative, EntityIDGroup } from '../types/meta';

export function analyzeCreativeSimilarity(creatives: Creative[]): EntityIDGroup[] {
  const groups = new Map<number, Creative[]>();
  for (const creative of creatives) {
    const group = groups.get(creative.entity_id_group) || [];
    group.push(creative);
    groups.set(creative.entity_id_group, group);
  }

  return Array.from(groups.entries()).map(([entityId, groupCreatives]) => ({
    entity_id: entityId,
    creatives: groupCreatives,
    total_spend: groupCreatives.reduce((sum, c) => sum + c.spend, 0),
    avg_cpa: groupCreatives.reduce((sum, c) => sum + c.cpa, 0) / groupCreatives.length,
    is_overcrowded: groupCreatives.length > 3,
  }));
}

export function calculateVisualSimilarity(hashA: string, hashB: string): number {
  // Simplified: compare image_hash prefix similarity
  let matches = 0;
  const len = Math.min(hashA.length, hashB.length);
  for (let i = 0; i < len; i++) {
    if (hashA[i] === hashB[i]) matches++;
  }
  return matches / len;
}

export function getOvercrowdedEntities(groups: EntityIDGroup[]): EntityIDGroup[] {
  return groups.filter(g => g.is_overcrowded);
}

export function suggestDiversification(groups: EntityIDGroup[]): string[] {
  const suggestions: string[] = [];
  const overcrowded = getOvercrowdedEntities(groups);

  if (overcrowded.length > 0) {
    suggestions.push(`${overcrowded.length} Entity ID(s) superlotado(s). Diversifique formatos visuais.`);
  }

  const formats = new Set(groups.flatMap(g => g.creatives.map(c => {
    if (c.name.includes('VSL') || c.name.includes('Reels')) return 'video';
    if (c.name.includes('Static')) return 'static';
    if (c.name.includes('UGC')) return 'ugc';
    if (c.name.includes('Carrossel')) return 'carousel';
    if (c.name.includes('Motion')) return 'motion';
    return 'other';
  })));

  if (!formats.has('ugc')) suggestions.push('Adicione criativos UGC — melhor Hook Rate médio.');
  if (!formats.has('video')) suggestions.push('Adicione vídeos curtos (Reels) — formato favorecido pelo algoritmo.');
  if (groups.length < 5) suggestions.push(`Apenas ${groups.length} Entity IDs. Alvo: 5+ para máxima presença no leilão.`);

  return suggestions;
}
