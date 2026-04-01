import React, { useState } from 'react';
import { Check, Info, Target, Megaphone, MousePointerClick, Eye, Heart, Smartphone } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface CampaignStepProps {
  form: {
    name: string;
    objective: string;
    bidStrategy: string;
    budgetType: 'daily' | 'lifetime';
    budget: number;
    specialCategories: string[];
  };
  onChange: (key: string, value: unknown) => void;
  mode: 'demo' | 'live';
  existingCampaigns: { id: string; name: string; status: string; objective: string }[];
  selectedCampaignId: string;
  onSelectCampaign: (id: string) => void;
  creationMode: 'new' | 'existing';
  onCreationModeChange: (mode: 'new' | 'existing') => void;
}

const OBJECTIVES = [
  { value: 'OUTCOME_SALES', label: 'Vendas', icon: Target },
  { value: 'OUTCOME_LEADS', label: 'Leads', icon: Megaphone },
  { value: 'OUTCOME_TRAFFIC', label: 'Tráfego', icon: MousePointerClick },
  { value: 'OUTCOME_AWARENESS', label: 'Reconhecimento', icon: Eye },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engajamento', icon: Heart },
  { value: 'OUTCOME_APP_PROMOTION', label: 'App', icon: Smartphone },
] as const;

const BID_STRATEGIES = [
  { value: 'LOWEST_COST_WITHOUT_CAP', label: 'Menor Custo' },
  { value: 'COST_CAP', label: 'Limite de Custo' },
  { value: 'BID_CAP', label: 'Limite de Lance' },
] as const;

const SPECIAL_CATEGORIES = [
  { value: 'CREDIT', label: 'Crédito' },
  { value: 'EMPLOYMENT', label: 'Emprego' },
  { value: 'HOUSING', label: 'Habitação' },
  { value: 'ISSUES_ELECTIONS_POLITICS', label: 'Política' },
  { value: 'NONE', label: 'Nenhuma' },
] as const;

const styles = {
  glassCard: {
    background: 'rgba(255,255,255,.34)',
    backdropFilter: 'blur(28px) saturate(1.6)',
    border: '1px solid rgba(255,255,255,.55)',
    borderRadius: 20,
    boxShadow: '0 30px 120px -45px rgba(15,23,42,.26), inset 0 1px 0 rgba(255,255,255,.92)',
  } as React.CSSProperties,
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    display: 'block',
  } as React.CSSProperties,
  input: {
    background: 'rgba(15,23,42,0.03)',
    border: '1px solid rgba(15,23,42,0.1)',
    borderRadius: 12,
    padding: '12px 16px',
    color: '#0f172a',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  } as React.CSSProperties,
  inputFocused: {
    borderColor: '#6366f1',
    boxShadow: '0 0 12px rgba(99,102,241,0.15)',
  } as React.CSSProperties,
};

function getInputStyle(isFocused: boolean): React.CSSProperties {
  return isFocused ? { ...styles.input, ...styles.inputFocused } : styles.input;
}

export default function CampaignStep({
  form,
  onChange,
  mode,
  existingCampaigns,
  selectedCampaignId,
  onSelectCampaign,
  creationMode,
  onCreationModeChange,
}: CampaignStepProps) {
  const isMobile = useIsMobile();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSpecialCategory = (value: string) => {
    if (value === 'NONE') {
      onChange('specialCategories', []);
      return;
    }
    const current = form.specialCategories;
    const next = current.includes(value)
      ? current.filter((c) => c !== value)
      : [...current, value];
    onChange('specialCategories', next);
  };

  const isCategorySelected = (value: string): boolean => {
    if (value === 'NONE') return form.specialCategories.length === 0;
    return form.specialCategories.includes(value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Mode Toggle — live only */}
      {mode === 'live' && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            borderRadius: 14,
            background: 'rgba(15,23,42,0.04)',
            alignSelf: isMobile ? 'stretch' : 'flex-start',
          }}
        >
          {([
            { key: 'new' as const, label: 'Criar Campanha' },
            { key: 'existing' as const, label: 'Usar Existente' },
          ]).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onCreationModeChange(opt.key)}
              style={{
                flex: isMobile ? 1 : 'none',
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s',
                background: creationMode === opt.key ? '#6366f1' : 'transparent',
                color: creationMode === opt.key ? '#fff' : '#64748b',
                boxShadow: creationMode === opt.key
                  ? '0 4px 16px rgba(99,102,241,0.3)'
                  : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Existing campaigns list */}
      {creationMode === 'existing' && mode === 'live' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={styles.label}>Selecione uma campanha</span>
          {existingCampaigns.map((campaign) => {
            const isSelected = selectedCampaignId === campaign.id;
            const isActive = campaign.status === 'ACTIVE';
            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => onSelectCampaign(campaign.id)}
                style={{
                  ...styles.glassCard,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  borderColor: isSelected ? '#6366f1' : 'rgba(255,255,255,.55)',
                  boxShadow: isSelected
                    ? '0 0 20px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,.92)'
                    : styles.glassCard.boxShadow,
                  transition: 'all 0.2s',
                  textAlign: 'left' as const,
                  width: '100%',
                }}
              >
                {/* Status dot */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isActive ? '#4ade80' : '#94a3b8',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 0 8px rgba(74,222,128,0.4)' : 'none',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {campaign.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {OBJECTIVES.find((o) => o.value === campaign.objective)?.label ?? campaign.objective}
                    {' · '}
                    {isActive ? 'Ativa' : 'Pausada'}
                  </div>
                </div>
                {isSelected && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
          {existingCampaigns.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: 13,
              }}
            >
              Nenhuma campanha encontrada nesta conta.
            </div>
          )}
        </div>
      )}

      {/* New campaign form */}
      {(creationMode === 'new' || mode === 'demo') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Campaign Name */}
          <div>
            <label style={styles.label}>Nome da Campanha</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ex: ASC — Protocolo Detox — Abril 2026"
              style={getInputStyle(focusedField === 'name')}
            />
          </div>

          {/* Objective */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span
                style={{
                  ...styles.label,
                  marginBottom: 0,
                }}
              >
                Objetivo
              </span>
              <div
                style={{ position: 'relative', display: 'inline-flex' }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <Info
                  size={14}
                  color="#94a3b8"
                  style={{ cursor: 'pointer' }}
                />
                {showTooltip && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: 8,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: '#0f172a',
                      color: '#e2e8f0',
                      fontSize: 12,
                      lineHeight: 1.5,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 12px 40px rgba(15,23,42,0.3)',
                      zIndex: 10,
                    }}
                  >
                    <strong>Vendas:</strong> ideal para e-commerce e infoprodutos.
                    <br />
                    <strong>Leads:</strong> formulários nativos.
                  </div>
                )}
              </div>
            </div>
            <select
              value={form.objective}
              onChange={(e) => onChange('objective', e.target.value)}
              onFocus={() => setFocusedField('objective')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...getInputStyle(focusedField === 'objective'),
                appearance: 'none' as const,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: 40,
              }}
            >
              <option value="">Selecione...</option>
              {OBJECTIVES.map((obj) => (
                <option key={obj.value} value={obj.value}>
                  {obj.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bid Strategy */}
          <div>
            <label style={styles.label}>Estrategia de Lance</label>
            <select
              value={form.bidStrategy}
              onChange={(e) => onChange('bidStrategy', e.target.value)}
              onFocus={() => setFocusedField('bidStrategy')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...getInputStyle(focusedField === 'bidStrategy'),
                appearance: 'none' as const,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: 40,
              }}
            >
              <option value="">Selecione...</option>
              {BID_STRATEGIES.map((bs) => (
                <option key={bs.value} value={bs.value}>
                  {bs.label}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Type Toggle */}
          <div>
            <label style={styles.label}>Tipo de Orcamento</label>
            <div
              style={{
                display: 'inline-flex',
                gap: 4,
                padding: 4,
                borderRadius: 14,
                background: 'rgba(15,23,42,0.04)',
              }}
            >
              {([
                { key: 'daily' as const, label: 'Diario' },
                { key: 'lifetime' as const, label: 'Vitalicio' },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onChange('budgetType', opt.key)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    background: form.budgetType === opt.key ? '#6366f1' : 'transparent',
                    color: form.budgetType === opt.key ? '#fff' : '#64748b',
                    boxShadow: form.budgetType === opt.key
                      ? '0 4px 16px rgba(99,102,241,0.3)'
                      : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label style={styles.label}>Orcamento</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              >
                R$
              </span>
              <input
                type="number"
                value={form.budget || ''}
                onChange={(e) => onChange('budget', Number(e.target.value))}
                onFocus={() => setFocusedField('budget')}
                onBlur={() => setFocusedField(null)}
                placeholder="0,00"
                min={0}
                step={0.01}
                style={{
                  ...getInputStyle(focusedField === 'budget'),
                  paddingLeft: 48,
                }}
              />
            </div>
          </div>

          {/* Special Categories */}
          <div>
            <label style={styles.label}>Categorias Especiais</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {SPECIAL_CATEGORIES.map((cat) => {
                const selected = isCategorySelected(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleSpecialCategory(cat.value)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 10,
                      border: selected
                        ? '1px solid #6366f1'
                        : '1px solid rgba(15,23,42,0.1)',
                      background: selected
                        ? 'rgba(99,102,241,0.08)'
                        : 'rgba(15,23,42,0.03)',
                      color: selected ? '#6366f1' : '#64748b',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {selected && <Check size={13} strokeWidth={3} />}
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
