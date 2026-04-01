import React, { useState, useCallback } from 'react';
import {
  Target,
  DollarSign,
  Users,
  LayoutGrid,
  Calendar,
  Plus,
  X,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Audience {
  id: string;
  name: string;
  size: number;
  cpa: number;
  roas: number;
  status: string;
}

interface AdSetStepProps {
  form: {
    name: string;
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
  };
  onChange: (key: string, value: unknown) => void;
  onTargetingChange: (key: string, value: unknown) => void;
  audiences: Audience[];
  mode: 'demo' | 'live';
  existingAdSets: { id: string; name: string; status: string; daily_budget: string }[];
  selectedAdSetId: string;
  onSelectAdSet: (id: string) => void;
  creationMode: 'new' | 'existing';
  onCreationModeChange: (mode: 'new' | 'existing') => void;
  campaignObjective: string;
}

/* ------------------------------------------------------------------ */
/*  Style helpers                                                      */
/* ------------------------------------------------------------------ */

const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")`;

const inputBase: React.CSSProperties = {
  background: 'rgba(15,23,42,0.03)',
  border: '1px solid rgba(15,23,42,0.1)',
  borderRadius: 12,
  padding: '12px 16px',
  color: '#0f172a',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const selectBase: React.CSSProperties = {
  ...inputBase,
  appearance: 'none' as const,
  cursor: 'pointer',
  backgroundImage: chevronSvg,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  backgroundSize: '16px 16px',
  paddingRight: 40,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'block',
};

const focusBorder: React.CSSProperties = {
  borderColor: '#6366f1',
  boxShadow: '0 0 12px rgba(99,102,241,0.15)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#0f172a',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 20,
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  background: 'rgba(15,23,42,0.06)',
  margin: '28px 0',
};

const pillBase: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid rgba(15,23,42,0.1)',
  background: 'rgba(15,23,42,0.03)',
  color: '#64748b',
  transition: 'all 0.2s',
};

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: '#6366f1',
  color: '#fff',
  border: '1px solid #6366f1',
  boxShadow: '0 0 12px rgba(99,102,241,0.2)',
};

const tagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  background: 'rgba(99,102,241,0.1)',
  color: '#6366f1',
};

const existingCardBase: React.CSSProperties = {
  padding: '14px 18px',
  borderRadius: 12,
  border: '1px solid rgba(15,23,42,0.1)',
  background: 'rgba(15,23,42,0.02)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const existingCardSelected: React.CSSProperties = {
  ...existingCardBase,
  borderColor: '#6366f1',
  background: 'rgba(99,102,241,0.04)',
  boxShadow: '0 0 12px rgba(99,102,241,0.1)',
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function useFocusStyle() {
  const [focused, setFocused] = useState<string | null>(null);
  const handlers = (name: string) => ({
    onFocus: () => setFocused(name),
    onBlur: () => setFocused(null),
  });
  const style = (name: string): React.CSSProperties =>
    focused === name ? focusBorder : {};
  return { handlers, style };
}

const PLACEMENTS = [
  'Feed',
  'Stories',
  'Reels',
  'Audience Network',
  'Messenger',
  'Search',
] as const;

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AdSetStep({
  form,
  onChange,
  onTargetingChange,
  audiences,
  mode,
  existingAdSets,
  selectedAdSetId,
  onSelectAdSet,
  creationMode,
  onCreationModeChange,
}: AdSetStepProps) {
  const isMobile = useIsMobile();
  const { handlers, style: focusStyle } = useFocusStyle();

  const [countryInput, setCountryInput] = useState('');
  const [manualPlacements, setManualPlacements] = useState<string[]>([
    'Feed',
    'Stories',
    'Reels',
  ]);

  /* helpers */
  const addCountry = useCallback(() => {
    const val = countryInput.trim().toUpperCase();
    if (val && !form.targeting.countries.includes(val)) {
      onTargetingChange('countries', [...form.targeting.countries, val]);
    }
    setCountryInput('');
  }, [countryInput, form.targeting.countries, onTargetingChange]);

  const removeCountry = (c: string) => {
    onTargetingChange(
      'countries',
      form.targeting.countries.filter((x) => x !== c),
    );
  };

  const toggleAudience = (
    key: 'customAudiences' | 'excludedAudiences',
    aud: { id: string; name: string },
  ) => {
    const current = form.targeting[key];
    const exists = current.some((a) => a.id === aud.id);
    onTargetingChange(
      key,
      exists ? current.filter((a) => a.id !== aud.id) : [...current, aud],
    );
  };

  const togglePlacement = (p: string) => {
    setManualPlacements((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const formatBudget = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  const renderSelect = (
    name: string,
    label: string,
    value: string,
    options: { label: string; value: string }[],
  ) => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        style={{ ...selectBase, ...focusStyle(name) }}
        {...handlers(name)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderPillGroup = (
    options: { label: string; value: string | number | number[] }[],
    current: string | number | number[],
    onSelect: (v: string | number | number[]) => void,
  ) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const active = JSON.stringify(current) === JSON.stringify(o.value);
        return (
          <button
            key={o.label}
            type="button"
            onClick={() => onSelect(o.value)}
            style={active ? pillActive : pillBase}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Mode toggle (live only)                                          */
  /* ---------------------------------------------------------------- */

  const modeToggle = mode === 'live' && (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {renderPillGroup(
          [
            { label: 'Criar Conjunto', value: 'new' },
            { label: 'Usar Existente', value: 'existing' },
          ],
          creationMode,
          (v) => onCreationModeChange(v as 'new' | 'existing'),
        )}
      </div>

      {creationMode === 'existing' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 28,
          }}
        >
          {existingAdSets.map((adSet) => (
            <div
              key={adSet.id}
              onClick={() => onSelectAdSet(adSet.id)}
              style={
                selectedAdSetId === adSet.id
                  ? existingCardSelected
                  : existingCardBase
              }
            >
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}
                >
                  {adSet.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    marginTop: 2,
                  }}
                >
                  R$ {parseFloat(adSet.daily_budget).toFixed(2)} / dia
                  &nbsp;&middot;&nbsp;
                  <span
                    style={{
                      color:
                        adSet.status === 'ACTIVE' ? '#4ade80' : '#f87171',
                    }}
                  >
                    {adSet.status === 'ACTIVE' ? 'Ativo' : adSet.status}
                  </span>
                </div>
              </div>
              {selectedAdSetId === adSet.id && (
                <CheckCircle2 size={18} color="#6366f1" />
              )}
            </div>
          ))}
          {existingAdSets.length === 0 && (
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              Nenhum conjunto de anúncios encontrado.
            </div>
          )}
        </div>
      )}
    </>
  );

  if (creationMode === 'existing' && mode === 'live') {
    return <div>{modeToggle}</div>;
  }

  /* ---------------------------------------------------------------- */
  /*  Full form                                                        */
  /* ---------------------------------------------------------------- */

  const gridCols = isMobile ? '1fr' : '1fr 1fr';

  return (
    <div>
      {modeToggle}

      {/* SECTION 1 — Conversão */}
      <div style={sectionTitleStyle}>
        <Target size={16} color="#6366f1" />
        Conversão
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 16 }}>
        {renderSelect('optimizationGoal', 'Meta de Otimização', form.optimizationGoal, [
          { label: 'Conversões', value: 'OFFSITE_CONVERSIONS' },
          { label: 'Valor', value: 'VALUE' },
          { label: 'Leads', value: 'LEAD_GENERATION' },
          { label: 'Cliques no Link', value: 'LINK_CLICKS' },
          { label: 'Visualizações de LP', value: 'LANDING_PAGE_VIEWS' },
          { label: 'Alcance', value: 'REACH' },
          { label: 'Impressões', value: 'IMPRESSIONS' },
        ])}

        {renderSelect('conversionLocation', 'Local de Conversão', form.conversionLocation, [
          { label: 'Site', value: 'WEBSITE' },
          { label: 'App', value: 'APP' },
          { label: 'Site e App', value: 'WEBSITE_AND_APP' },
        ])}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Pixel ID</label>
          <input
            type="text"
            value={form.pixelId}
            onChange={(e) => onChange('pixelId', e.target.value)}
            placeholder="Ex: 123456789012345"
            style={{ ...inputBase, ...focusStyle('pixelId') }}
            {...handlers('pixelId')}
          />
        </div>

        {renderSelect('conversionEvent', 'Evento de Conversão', form.conversionEvent, [
          { label: 'Purchase', value: 'Purchase' },
          { label: 'Lead', value: 'Lead' },
          { label: 'AddToCart', value: 'AddToCart' },
          { label: 'InitiateCheckout', value: 'InitiateCheckout' },
          { label: 'ViewContent', value: 'ViewContent' },
          { label: 'CompleteRegistration', value: 'CompleteRegistration' },
        ])}

        {renderSelect(
          'attributionWindow',
          'Janela de Atribuição',
          form.attributionWindow,
          [
            { label: '1 dia clique', value: '1d_click' },
            { label: '7 dias clique', value: '7d_click' },
            { label: '1 dia clique + 1 dia visualização', value: '1d_click_1d_view' },
            { label: '7 dias clique + 1 dia visualização', value: '7d_click_1d_view' },
          ],
        )}
      </div>

      <div style={dividerStyle} />

      {/* SECTION 2 — Orçamento e Programação */}
      <div style={sectionTitleStyle}>
        <DollarSign size={16} color="#6366f1" />
        Orçamento e Programação
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Tipo</label>
        {renderPillGroup(
          [
            { label: 'Diário', value: 'daily' },
            { label: 'Vitalício', value: 'lifetime' },
          ],
          form.budgetType,
          (v) => onChange('budgetType', v),
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <label style={labelStyle}>Orçamento</label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 13,
                fontWeight: 600,
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            >
              R$
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.budget}
              onChange={(e) => onChange('budget', parseFloat(e.target.value) || 0)}
              style={{
                ...inputBase,
                paddingLeft: 44,
                ...focusStyle('budget'),
              }}
              {...handlers('budget')}
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#94a3b8',
              marginTop: 4,
            }}
          >
            {form.budgetType === 'daily'
              ? `R$ ${formatBudget(form.budget * 30)} / mês estimado`
              : `Orçamento total para o período`}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: 16,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            <Calendar size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            Data de Início
          </label>
          <input
            type="datetime-local"
            value={form.scheduleStart}
            onChange={(e) => onChange('scheduleStart', e.target.value)}
            style={{ ...inputBase, ...focusStyle('scheduleStart') }}
            {...handlers('scheduleStart')}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            <Calendar size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            Data de Término
            <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
              (opcional)
            </span>
          </label>
          <input
            type="datetime-local"
            value={form.scheduleEnd}
            onChange={(e) => onChange('scheduleEnd', e.target.value)}
            style={{ ...inputBase, ...focusStyle('scheduleEnd') }}
            {...handlers('scheduleEnd')}
          />
        </div>
      </div>

      <div style={dividerStyle} />

      {/* SECTION 3 — Público */}
      <div style={sectionTitleStyle}>
        <Users size={16} color="#6366f1" />
        Público
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Tipo</label>
        {renderPillGroup(
          [
            { label: 'Advantage+', value: 'advantage_plus' },
            { label: 'Controles Manuais', value: 'manual' },
          ],
          form.targeting.type,
          (v) => onTargetingChange('type', v),
        )}
      </div>

      {form.targeting.type === 'manual' && (
        <div
          style={{
            padding: 20,
            borderRadius: 14,
            border: '1px solid rgba(15,23,42,0.06)',
            background: 'rgba(15,23,42,0.015)',
          }}
        >
          {/* Países */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              <Globe size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
              Países
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {form.targeting.countries.map((c) => (
                <span key={c} style={tagStyle}>
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCountry(c)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    <X size={12} color="#6366f1" />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Código do país (ex: BR)"
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCountry();
                  }
                }}
                style={{
                  ...inputBase,
                  flex: 1,
                  ...focusStyle('countryInput'),
                }}
                {...handlers('countryInput')}
              />
              <button
                type="button"
                onClick={addCountry}
                style={{
                  ...pillBase,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>
          </div>

          {/* Idade */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Idade</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Mín</span>
                <input
                  type="number"
                  min={18}
                  max={65}
                  value={form.targeting.ageMin}
                  onChange={(e) =>
                    onTargetingChange('ageMin', parseInt(e.target.value) || 18)
                  }
                  style={{ ...inputBase, ...focusStyle('ageMin') }}
                  {...handlers('ageMin')}
                />
              </div>
              <span style={{ color: '#cbd5e1', fontSize: 16, marginTop: 16 }}>
                —
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Máx</span>
                <input
                  type="number"
                  min={18}
                  max={65}
                  value={form.targeting.ageMax}
                  onChange={(e) =>
                    onTargetingChange('ageMax', parseInt(e.target.value) || 65)
                  }
                  style={{ ...inputBase, ...focusStyle('ageMax') }}
                  {...handlers('ageMax')}
                />
              </div>
            </div>
          </div>

          {/* Gênero */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Gênero</label>
            {renderPillGroup(
              [
                { label: 'Todos', value: [0] },
                { label: 'Masculino', value: [1] },
                { label: 'Feminino', value: [2] },
              ],
              form.targeting.genders,
              (v) => onTargetingChange('genders', v),
            )}
          </div>

          {/* Públicos Personalizados */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Públicos Personalizados</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {audiences.map((aud) => {
                const selected = form.targeting.customAudiences.some(
                  (a) => a.id === aud.id,
                );
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() =>
                      toggleAudience('customAudiences', {
                        id: aud.id,
                        name: aud.name,
                      })
                    }
                    style={{
                      ...(selected ? pillActive : pillBase),
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 2,
                      padding: '8px 14px',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{aud.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        opacity: 0.7,
                      }}
                    >
                      {aud.size.toLocaleString('pt-BR')} pessoas
                    </span>
                  </button>
                );
              })}
              {audiences.length === 0 && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Nenhum público disponível
                </span>
              )}
            </div>
          </div>

          {/* Excluir Públicos */}
          <div>
            <label style={labelStyle}>Excluir Públicos</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {audiences.map((aud) => {
                const selected = form.targeting.excludedAudiences.some(
                  (a) => a.id === aud.id,
                );
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() =>
                      toggleAudience('excludedAudiences', {
                        id: aud.id,
                        name: aud.name,
                      })
                    }
                    style={{
                      ...(selected
                        ? {
                            ...pillBase,
                            background: 'rgba(248,113,113,0.1)',
                            color: '#f87171',
                            border: '1px solid #f87171',
                          }
                        : pillBase),
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 2,
                      padding: '8px 14px',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{aud.name}</span>
                    <span
                      style={{
                        fontSize: 11,
                        opacity: 0.7,
                      }}
                    >
                      {aud.size.toLocaleString('pt-BR')} pessoas
                    </span>
                  </button>
                );
              })}
              {audiences.length === 0 && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Nenhum público disponível
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={dividerStyle} />

      {/* SECTION 4 — Posicionamentos */}
      <div style={sectionTitleStyle}>
        <LayoutGrid size={16} color="#6366f1" />
        Posicionamentos
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Tipo</label>
        {renderPillGroup(
          [
            { label: 'Advantage+ Posicionamentos', value: 'advantage' },
            { label: 'Manual', value: 'manual' },
          ],
          form.placements,
          (v) => onChange('placements', v),
        )}
      </div>

      {form.placements === 'manual' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: 10,
          }}
        >
          {PLACEMENTS.map((p) => {
            const checked = manualPlacements.includes(p);
            return (
              <label
                key={p}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${checked ? 'rgba(99,102,241,0.3)' : 'rgba(15,23,42,0.08)'}`,
                  background: checked
                    ? 'rgba(99,102,241,0.04)'
                    : 'rgba(15,23,42,0.015)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePlacement(p)}
                  style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: checked ? '#6366f1' : '#64748b',
                  }}
                >
                  {p}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
