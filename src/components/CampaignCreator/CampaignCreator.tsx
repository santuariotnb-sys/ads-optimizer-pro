import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Upload, Sparkles, Info, Loader2, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useStore } from '../../store/useStore';
import { MetaApiService } from '../../services/metaApi';

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,.34)',
  backdropFilter: 'blur(28px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,.55)',
  borderRadius: 20,
  padding: 32,
  maxWidth: 800,
  margin: '0 auto',
  boxShadow: '0 30px 120px -45px rgba(15,23,42,.26), inset 0 1px 0 rgba(255,255,255,.92)',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box' as const,
  background: 'rgba(15,23,42,0.03)',
  border: '1px solid rgba(15,23,42,0.1)',
  borderRadius: 12,
  padding: '12px 16px',
  color: '#0f172a',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
};

const selectBase: React.CSSProperties = {
  ...inputBase,
  appearance: 'none' as const,
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 36,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: 8,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

type CreationMode = 'new' | 'existing';
const stepLabels = ['Campanha', 'Conjunto de Anúncios', 'Anúncio'];
const specialCategories = ['Crédito', 'Emprego', 'Habitação', 'Política', 'Nenhuma'];

const defaultFormState = {
  campaignName: '',
  objective: 'OUTCOME_SALES',
  bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
  dailyBudget: '',
  specialCategories: [] as string[],
  countries: ['Brasil'],
  newCountry: '',
  ageMin: 18,
  ageMax: 65,
  gender: 'all',
  optimizationGoal: 'OFFSITE_CONVERSIONS',
  attributionWindow: 'first_conversion',
  advantagePlacements: true,
  adName: '',
  creativeFile: null as File | null,
};

const recommendedDefaults = {
  campaignName: 'ASC — Protocolo Detox — ' + new Date().toLocaleDateString('pt-BR'),
  objective: 'OUTCOME_SALES',
  bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
  dailyBudget: '500',
  specialCategories: ['Nenhuma'],
  countries: ['Brasil'],
  newCountry: '',
  ageMin: 18,
  ageMax: 65,
  gender: 'all',
  optimizationGoal: 'OFFSITE_CONVERSIONS',
  attributionWindow: 'first_conversion',
  advantagePlacements: true,
  adName: 'Static Antes/Depois — v1',
  creativeFile: null as File | null,
};

export default function CampaignCreator() {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...defaultFormState });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Real API state
  const accessToken = useStore((s) => s.accessToken);
  const adAccountId = useStore((s) => s.adAccountId);
  const setAdAccountId = useStore((s) => s.setAdAccountId);
  const mode = useStore((s) => s.mode);

  const [accounts, setAccounts] = useState<{ id: string; name: string; currency: string; status: number }[]>([]);
  const [pages, setPages] = useState<{ id: string; name: string; picture: string }[]>([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Existing campaign/adset selection
  const [campaignMode, setCampaignMode] = useState<CreationMode>('new');
  const [adSetMode, setAdSetMode] = useState<CreationMode>('new');
  const [existingCampaigns, setExistingCampaigns] = useState<{ id: string; name: string; status: string; objective: string }[]>([]);
  const [existingAdSets, setExistingAdSets] = useState<{ id: string; name: string; status: string; daily_budget: string }[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedAdSetId, setSelectedAdSetId] = useState('');

  // Fetch ad accounts and pages on mount
  useEffect(() => {
    if (mode !== 'live' || !accessToken) return;
    let cancelled = false;
    const api = new MetaApiService(accessToken, adAccountId || '');
    api.fetchAdAccounts().then(res => {
      if (cancelled) return;
      if (res.data?.length) {
        setAccounts(res.data.map(a => ({ id: a.id.replace('act_', ''), name: a.name, currency: a.currency, status: a.account_status })));
        if (!adAccountId && res.data.length === 1) {
          setAdAccountId(res.data[0].id.replace('act_', ''));
        }
      }
    }).catch(() => {});
    api.fetchPagesWithPicture().then(res => {
      if (cancelled) return;
      if (res.data?.length) {
        setPages(res.data.map(p => ({ id: p.id, name: p.name, picture: p.picture?.data?.url || '' })));
        if (res.data.length === 1) setSelectedPage(res.data[0].id);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [mode, accessToken, adAccountId, setAdAccountId]);

  // Fetch existing campaigns when account changes
  useEffect(() => {
    if (!accessToken || !adAccountId) return;
    let cancelled = false;
    const api = new MetaApiService(accessToken, adAccountId);
    api.fetchCampaignsList().then(res => {
      if (!cancelled && res.data) setExistingCampaigns(res.data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [accessToken, adAccountId]);

  // Fetch ad sets when campaign selected
  useEffect(() => {
    if (!accessToken || !adAccountId || !selectedCampaignId) return;
    let cancelled = false;
    const api = new MetaApiService(accessToken, adAccountId);
    api.fetchAdSetsList(selectedCampaignId).then(res => {
      if (!cancelled && res.data) setExistingAdSets(res.data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [accessToken, adAccountId, selectedCampaignId]);

  // Submit campaign to Meta
  async function handleSubmit() {
    if (!accessToken || !adAccountId) {
      setSubmitError('Selecione uma conta de anúncios primeiro.');
      return;
    }
    if (!form.campaignName.trim()) { setSubmitError('Nome da campanha é obrigatório.'); return; }
    if (!form.dailyBudget || Number(form.dailyBudget) <= 0) { setSubmitError('Orçamento diário é obrigatório.'); return; }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    const api = new MetaApiService(accessToken, adAccountId);
    const genderMap: Record<string, number[]> = { all: [0], male: [1], female: [2] };

    try {
      // 1. Campaign: create new or use existing
      let campaignId = selectedCampaignId;
      if (campaignMode === 'new') {
        if (!form.campaignName.trim()) { setSubmitError('Nome da campanha é obrigatório.'); setSubmitting(false); return; }
        const specialCats = form.specialCategories.includes('Nenhuma') ? [] : form.specialCategories.map(c => {
          const map: Record<string, string> = { 'Crédito': 'CREDIT', 'Emprego': 'EMPLOYMENT', 'Habitação': 'HOUSING', 'Política': 'ISSUES_ELECTIONS_POLITICS' };
          return map[c] || c;
        });
        const campaign = await api.createCampaign({
          name: form.campaignName,
          objective: form.objective,
          status: 'PAUSED',
          special_ad_categories: specialCats,
        });
        campaignId = campaign.id;
      }
      if (!campaignId) { setSubmitError('Selecione ou crie uma campanha.'); setSubmitting(false); return; }

      // 2. Ad Set: create new or use existing
      let adSetId = selectedAdSetId;
      if (adSetMode === 'new') {
        if (!form.dailyBudget || Number(form.dailyBudget) <= 0) { setSubmitError('Orçamento diário é obrigatório.'); setSubmitting(false); return; }
        const countryCodes: Record<string, string> = { 'Brasil': 'BR', 'Estados Unidos': 'US', 'Portugal': 'PT', 'Argentina': 'AR', 'México': 'MX' };
        const targeting: Record<string, unknown> = {
          geo_locations: { countries: form.countries.map(c => countryCodes[c] || c.substring(0, 2).toUpperCase()) },
          age_min: form.ageMin,
          age_max: form.ageMax,
          genders: genderMap[form.gender] || [0],
        };
        const adSet = await api.createAdSet({
          campaign_id: campaignId,
          name: `${form.campaignName || 'Campaign'} — Ad Set`,
          optimization_goal: form.optimizationGoal,
          billing_event: 'IMPRESSIONS',
          daily_budget: Math.round(Number(form.dailyBudget) * 100),
          targeting,
          status: 'PAUSED',
        });
        adSetId = adSet.id;
      }
      if (!adSetId) { setSubmitError('Selecione ou crie um conjunto de anúncios.'); setSubmitting(false); return; }

      // 3. Upload image + create ad (if provided)
      let creativeId = '';
      if (form.creativeFile && selectedPage) {
        const image = await api.uploadImage(form.creativeFile);
        const creative = await api.createAdCreative({
          name: `${form.adName || form.campaignName || 'Ad'} — Creative`,
          image_hash: image.hash,
          page_id: selectedPage,
        });
        creativeId = creative.id;
      }

      if (creativeId) {
        await api.createAd({
          name: form.adName || `${form.campaignName || 'Campaign'} — Ad`,
          adset_id: adSetId,
          creative_id: creativeId,
          status: 'PAUSED',
        });
      }

      const action = campaignMode === 'new' ? 'Campanha criada' : 'Anúncio adicionado';
      setSubmitSuccess(
        creativeId
          ? `${action} com sucesso! — Status: PAUSADO. Ative no Gerenciador de Anúncios.`
          : `${action}! — Adicione o criativo no Gerenciador de Anúncios.`
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao criar campanha');
    } finally {
      setSubmitting(false);
    }
  }

  const updateForm = (key: string, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleSpecialCategory = (cat: string) => {
    setForm(prev => {
      if (cat === 'Nenhuma') return { ...prev, specialCategories: ['Nenhuma'] };
      const filtered = prev.specialCategories.filter(c => c !== 'Nenhuma');
      return {
        ...prev,
        specialCategories: filtered.includes(cat)
          ? filtered.filter(c => c !== cat)
          : [...filtered, cat],
      };
    });
  };

  const addCountry = () => {
    if (form.newCountry.trim() && !form.countries.includes(form.newCountry.trim())) {
      setForm(prev => ({
        ...prev,
        countries: [...prev.countries, prev.newCountry.trim()],
        newCountry: '',
      }));
    }
  };

  const removeCountry = (country: string) => {
    setForm(prev => ({ ...prev, countries: prev.countries.filter(c => c !== country) }));
  };

  const fillDefaults = () => setForm({ ...recommendedDefaults });

  const getInputStyle = (field: string): React.CSSProperties => ({
    ...inputBase,
    borderColor: focusedField === field ? '#6366f1' : 'rgba(15,23,42,0.1)',
    boxShadow: focusedField === field ? '0 0 12px rgba(99,102,241,0.15)' : 'none',
  });

  const getSelectStyle = (field: string): React.CSSProperties => ({
    ...selectBase,
    borderColor: focusedField === field ? '#6366f1' : 'rgba(15,23,42,0.1)',
    boxShadow: focusedField === field ? '0 0 12px rgba(99,102,241,0.15)' : 'none',
  });

  const renderStepIndicator = () => (
    <div role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={stepLabels.length} aria-label={`Etapa ${step + 1} de ${stepLabels.length}: ${stepLabels[step]}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: isMobile ? 24 : 40 }}>
      {stepLabels.map((label, i) => {
        const isCompleted = i < step;
        const isActive = i === step;
        const isUpcoming = i > step;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
              <div style={{
                width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                background: isCompleted ? '#4ade80'
                  : isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(15,23,42,0.06)',
                color: isUpcoming ? '#94a3b8' : '#fff',
                border: isActive ? '2px solid #6366f1' : 'none',
                boxShadow: isActive ? '0 0 20px rgba(99,102,241,0.3)' : isCompleted ? '0 0 12px rgba(74,222,128,0.3)' : 'none',
                transition: 'all 0.3s',
              }}>
                {isCompleted ? <Check size={18} /> : i + 1}
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#0f172a' : '#94a3b8',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div style={{
                width: isMobile ? 40 : 80, height: 2,
                background: i < step ? '#4ade80' : 'rgba(15,23,42,0.08)',
                margin: '0 12px', marginBottom: 28,
                borderRadius: 1, transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );

  const modeToggle = (label: string, value: CreationMode, onChange: (m: CreationMode) => void) => (
    <div style={{ display: 'flex', gap: 4, padding: 3, background: 'rgba(15,23,42,0.04)', borderRadius: 10, marginBottom: 16 }}>
      {(['new', 'existing'] as const).map(m => (
        <button key={m} onClick={() => onChange(m)} style={{
          flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: value === m ? '#fff' : 'transparent',
          boxShadow: value === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          color: value === m ? '#0f172a' : '#94a3b8',
          fontSize: 13, fontWeight: value === m ? 600 : 400, transition: 'all 0.2s',
        }}>
          {m === 'new' ? `Criar ${label}` : `Usar ${label} existente`}
        </button>
      ))}
    </div>
  );

  const renderExistingCampaignPicker = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
      {existingCampaigns.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Nenhuma campanha encontrada</div>}
      {existingCampaigns.map(c => {
        const sel = selectedCampaignId === c.id;
        return (
          <button key={c.id} onClick={() => setSelectedCampaignId(c.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            background: sel ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.02)',
            border: `2px solid ${sel ? '#6366f1' : 'rgba(15,23,42,0.06)'}`,
            borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.status === 'ACTIVE' ? '#4ade80' : '#94a3b8', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.objective.replace('OUTCOME_', '')} · {c.status}</div>
            </div>
            {sel && <Check size={14} color="#6366f1" />}
          </button>
        );
      })}
    </div>
  );

  const renderExistingAdSetPicker = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
      {existingAdSets.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{selectedCampaignId ? 'Nenhum conjunto encontrado' : 'Selecione uma campanha primeiro'}</div>}
      {existingAdSets.map(a => {
        const sel = selectedAdSetId === a.id;
        return (
          <button key={a.id} onClick={() => setSelectedAdSetId(a.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            background: sel ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.02)',
            border: `2px solid ${sel ? '#6366f1' : 'rgba(15,23,42,0.06)'}`,
            borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.status === 'ACTIVE' ? '#4ade80' : '#94a3b8', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.daily_budget ? `R$ ${(Number(a.daily_budget) / 100).toFixed(2)}/dia` : 'Sem budget'} · {a.status}</div>
            </div>
            {sel && <Check size={14} color="#6366f1" />}
          </button>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {mode === 'live' && modeToggle('Campanha', campaignMode, setCampaignMode)}

      {campaignMode === 'existing' && mode === 'live' ? renderExistingCampaignPicker() : (
      <>
      <div>
        <label style={labelStyle}>Nome da Campanha</label>
        <input
          aria-label="Nome da Campanha"
          style={getInputStyle('campaignName')}
          placeholder="Ex: ASC — Protocolo Detox — Março"
          value={form.campaignName}
          onChange={e => updateForm('campaignName', e.target.value)}
          onFocus={() => setFocusedField('campaignName')}
          onBlur={() => setFocusedField(null)}
        />
      </div>
      <div>
        <label style={labelStyle}>Objetivo</label>
        <select
          aria-label="Objetivo"
          style={getSelectStyle('objective')}
          value={form.objective}
          onChange={e => updateForm('objective', e.target.value)}
          onFocus={() => setFocusedField('objective')}
          onBlur={() => setFocusedField(null)}
        >
          <option value="OUTCOME_SALES">Vendas (OUTCOME_SALES)</option>
          <option value="OUTCOME_LEADS">Leads (OUTCOME_LEADS)</option>
          <option value="OUTCOME_TRAFFIC">Tráfego (OUTCOME_TRAFFIC)</option>
          <option value="OUTCOME_AWARENESS">Reconhecimento (OUTCOME_AWARENESS)</option>
          <option value="OUTCOME_ENGAGEMENT">Engajamento (OUTCOME_ENGAGEMENT)</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Estratégia de Lance</label>
        <select
          aria-label="Estratégia de Lance"
          style={getSelectStyle('bidStrategy')}
          value={form.bidStrategy}
          onChange={e => updateForm('bidStrategy', e.target.value)}
          onFocus={() => setFocusedField('bidStrategy')}
          onBlur={() => setFocusedField(null)}
        >
          <option value="LOWEST_COST_WITHOUT_CAP">Menor Custo (LOWEST_COST_WITHOUT_CAP)</option>
          <option value="COST_CAP">Limite de Custo (COST_CAP)</option>
          <option value="BID_CAP">Limite de Lance (BID_CAP)</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Budget Diário (R$)</label>
        <input
          type="number"
          aria-label="Budget Diário"
          style={getInputStyle('dailyBudget')}
          placeholder="Ex: 500"
          value={form.dailyBudget}
          onChange={e => updateForm('dailyBudget', e.target.value)}
          onFocus={() => setFocusedField('dailyBudget')}
          onBlur={() => setFocusedField(null)}
        />
      </div>
      <div>
        <label style={labelStyle}>Categorias Especiais</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {specialCategories.map(cat => {
            const isChecked = form.specialCategories.includes(cat);
            return (
              <label key={cat} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                background: isChecked ? 'rgba(99,102,241,0.15)' : 'rgba(15,23,42,0.03)',
                border: `1px solid ${isChecked ? 'rgba(99,102,241,0.4)' : 'rgba(15,23,42,0.08)'}`,
                borderRadius: 8, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
              }}>
                <input type="checkbox" checked={isChecked} onChange={() => toggleSpecialCategory(cat)} style={{ display: 'none' }} />
                <div style={{
                  width: 18, height: 18, borderRadius: 4,
                  border: `2px solid ${isChecked ? '#6366f1' : 'rgba(15,23,42,0.2)'}`,
                  background: isChecked ? '#6366f1' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}>
                  {isChecked && <Check size={12} color="#fff" />}
                </div>
                {cat}
              </label>
            );
          })}
        </div>
      </div>
      </>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {mode === 'live' && campaignMode === 'existing' && modeToggle('Conjunto', adSetMode, setAdSetMode)}

      {adSetMode === 'existing' && mode === 'live' && campaignMode === 'existing' ? renderExistingAdSetPicker() : (
      <>
      {/* Countries */}
      <div>
        <label style={labelStyle}>Países</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {form.countries.map(country => (
            <span key={country} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20,
              fontSize: 13, color: '#8b5cf6',
            }}>
              {country}
              <button onClick={() => removeCountry(country)} style={{
                background: 'none', border: 'none', color: '#8b5cf6',
                cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1,
              }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            aria-label="Adicionar país"
            style={{ ...getInputStyle('newCountry'), flex: 1 }}
            placeholder="Adicionar país..."
            value={form.newCountry}
            onChange={e => updateForm('newCountry', e.target.value)}
            onFocus={() => setFocusedField('newCountry')}
            onBlur={() => setFocusedField(null)}
            onKeyDown={e => e.key === 'Enter' && addCountry()}
          />
          <button onClick={addCountry} style={{
            background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 10, padding: '12px 20px', color: '#8b5cf6',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>Adicionar</button>
        </div>
      </div>

      {/* Age Range */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Idade Mínima</label>
          <input type="number" min={18} max={65} aria-label="Idade Mínima" style={getInputStyle('ageMin')} value={form.ageMin}
            onChange={e => updateForm('ageMin', Number(e.target.value))}
            onFocus={() => setFocusedField('ageMin')} onBlur={() => setFocusedField(null)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Idade Máxima</label>
          <input type="number" min={18} max={65} aria-label="Idade Máxima" style={getInputStyle('ageMax')} value={form.ageMax}
            onChange={e => updateForm('ageMax', Number(e.target.value))}
            onFocus={() => setFocusedField('ageMax')} onBlur={() => setFocusedField(null)} />
        </div>
      </div>

      {/* Gender */}
      <div>
        <label style={labelStyle}>Gênero</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: 'all', label: 'Todos' },
            { value: 'male', label: 'Masculino' },
            { value: 'female', label: 'Feminino' },
          ].map(opt => (
            <label key={opt.value} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 16px',
              background: form.gender === opt.value ? 'rgba(99,102,241,0.15)' : 'rgba(15,23,42,0.03)',
              border: `1px solid ${form.gender === opt.value ? 'rgba(99,102,241,0.4)' : 'rgba(15,23,42,0.08)'}`,
              borderRadius: 10, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s',
            }}>
              <input type="radio" name="gender" value={opt.value} checked={form.gender === opt.value}
                onChange={e => updateForm('gender', e.target.value)} style={{ display: 'none' }} />
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${form.gender === opt.value ? '#6366f1' : 'rgba(15,23,42,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {form.gender === opt.value && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
                )}
              </div>
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Optimization Goal */}
      <div>
        <label style={labelStyle}>Meta de Otimização</label>
        <select aria-label="Meta de Otimização" style={getSelectStyle('optimizationGoal')} value={form.optimizationGoal}
          onChange={e => updateForm('optimizationGoal', e.target.value)}
          onFocus={() => setFocusedField('optimizationGoal')} onBlur={() => setFocusedField(null)}>
          <option value="OFFSITE_CONVERSIONS">Conversões Externas (OFFSITE_CONVERSIONS)</option>
          <option value="VALUE">Valor (VALUE)</option>
          <option value="LANDING_PAGE_VIEWS">Visualizações de Página</option>
          <option value="LINK_CLICKS">Cliques no Link</option>
        </select>
      </div>

      {/* Attribution Window */}
      <div>
        <label style={labelStyle}>Janela de Atribuição</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: 'first_conversion', label: 'First Conversion', recommended: true },
            { value: 'all_conversions', label: 'All Conversions', recommended: false },
          ].map(opt => (
            <label key={opt.value} style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px',
              background: form.attributionWindow === opt.value ? 'rgba(99,102,241,0.15)' : 'rgba(15,23,42,0.03)',
              border: `1px solid ${form.attributionWindow === opt.value ? 'rgba(99,102,241,0.4)' : 'rgba(15,23,42,0.08)'}`,
              borderRadius: 10, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s',
            }}>
              <input type="radio" name="attribution" value={opt.value}
                checked={form.attributionWindow === opt.value}
                onChange={e => updateForm('attributionWindow', e.target.value)} style={{ display: 'none' }} />
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${form.attributionWindow === opt.value ? '#6366f1' : 'rgba(15,23,42,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {form.attributionWindow === opt.value && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
                )}
              </div>
              <span>{opt.label}</span>
              {opt.recommended && (
                <span style={{
                  background: 'rgba(74,222,128,0.15)', color: '#4ade80',
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, marginLeft: 'auto',
                }}>Recomendado</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Placements Toggle */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Placements</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: 'rgba(99,102,241,0.15)', color: '#8b5cf6',
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
            }}>Recomendado</span>
            <button onClick={() => updateForm('advantagePlacements', !form.advantagePlacements)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center',
            }}>
              <div style={{
                width: 48, height: 26, borderRadius: 13,
                background: form.advantagePlacements ? '#6366f1' : 'rgba(15,23,42,0.1)',
                position: 'relative', transition: 'background 0.2s',
                boxShadow: form.advantagePlacements ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: form.advantagePlacements ? 25 : 3,
                  transition: 'left 0.2s',
                }} />
              </div>
            </button>
          </div>
        </div>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>
          Advantage+ Placements {form.advantagePlacements ? 'ativado' : 'desativado'}
        </span>
      </div>

      {/* Info Banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 18px', background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, marginTop: 4,
      }}>
        <Info size={18} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 13, color: '#8b5cf6', lineHeight: 1.5 }}>
          Broad targeting é recomendado — o Andromeda otimiza melhor sem restrições de interesses
        </span>
      </div>
      </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Drag & Drop Zone */}
      <div>
        <label style={labelStyle}>Criativo</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) updateForm('creativeFile', file);
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,video/*';
            input.onchange = (ev: Event) => {
              const file = (ev.target as HTMLInputElement).files?.[0];
              if (file) updateForm('creativeFile', file);
            };
            input.click();
          }}
          style={{
            border: `2px dashed ${dragOver ? '#6366f1' : 'rgba(15,23,42,0.12)'}`,
            borderRadius: 14, padding: 48, textAlign: 'center',
            background: dragOver ? 'rgba(99,102,241,0.06)' : 'rgba(15,23,42,0.02)',
            transition: 'all 0.2s', cursor: 'pointer',
          }}
        >
          <Upload size={40} color={dragOver ? '#6366f1' : '#475569'} style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8', marginBottom: 8, marginTop: 0 }}>
            Arraste seu criativo aqui
          </p>
          <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
            ou clique para selecionar um arquivo
          </p>
          {form.creativeFile && (
            <p style={{ fontSize: 13, color: '#4ade80', marginTop: 12, marginBottom: 0 }}>
              <Check size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {form.creativeFile.name}
            </p>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div style={{
        background: 'rgba(15,23,42,0.03)', border: '1px solid rgba(15,23,42,0.06)',
        borderRadius: 14, padding: 40, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>🖼</div>
        <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>Pré-visualização do criativo</p>
      </div>

      {/* Ad Name */}
      <div>
        <label style={labelStyle}>Nome do Anúncio</label>
        <input
          aria-label="Nome do Anúncio"
          style={getInputStyle('adName')}
          placeholder="Ex: Static Antes/Depois — v1"
          value={form.adName}
          onChange={e => updateForm('adName', e.target.value)}
          onFocus={() => setFocusedField('adName')}
          onBlur={() => setFocusedField(null)}
        />
      </div>

      {/* Info */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 18px', background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12,
      }}>
        <Info size={18} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 13, color: '#8b5cf6', lineHeight: 1.5 }}>
          Recomendamos 6 criativos por ad set com Entity IDs diferentes
        </span>
      </div>
    </div>
  );

  return (
    <div style={{
      padding: isMobile ? 0 : 8,
      color: '#0f172a',
    }}>
      <div className="tilt-card" style={{ ...glassCard, maxWidth: isMobile ? '100%' : 800, padding: isMobile ? 16 : 32 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 700, marginBottom: 8, marginTop: 0,
          background: 'linear-gradient(135deg, #0f172a, #6366f1)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Criar Nova Campanha
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32 }}>
          Configure sua campanha seguindo as melhores práticas do Meta Ads
        </p>

        {/* Account & Page selector (live mode only) */}
        {mode === 'live' && accessToken && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Ad Account Selector */}
            <div>
              <label style={labelStyle}>Conta de Anúncios</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {accounts.map(a => {
                  const selected = adAccountId === a.id;
                  const statusColor = a.status === 1 ? '#4ade80' : a.status === 2 ? '#facc15' : '#f87171';
                  const statusLabel = a.status === 1 ? 'Ativa' : a.status === 2 ? 'Desativada' : 'Suspensa';
                  return (
                    <button key={a.id} onClick={() => setAdAccountId(a.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      background: selected ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.02)',
                      border: `2px solid ${selected ? '#6366f1' : 'rgba(15,23,42,0.06)'}`,
                      borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: selected ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(15,23,42,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: selected ? '#fff' : '#64748b',
                      }}>
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{statusLabel} · {a.currency}</span>
                        </div>
                      </div>
                      {selected && <Check size={16} color="#6366f1" />}
                    </button>
                  );
                })}
                {accounts.length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    Carregando contas...
                  </div>
                )}
              </div>
            </div>

            {/* Page Selector with pictures */}
            <div>
              <label style={labelStyle}>Página do Facebook</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pages.map(p => {
                  const selected = selectedPage === p.id;
                  return (
                    <button key={p.id} onClick={() => setSelectedPage(p.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      background: selected ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.02)',
                      border: `2px solid ${selected ? '#6366f1' : 'rgba(15,23,42,0.06)'}`,
                      borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s',
                    }}>
                      {p.picture ? (
                        <img src={p.picture} alt={p.name} style={{
                          width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0,
                          border: selected ? '2px solid #6366f1' : '2px solid rgba(15,23,42,0.06)',
                        }} />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: 'rgba(15,23,42,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, color: '#64748b',
                        }}>
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>ID: {p.id}</div>
                      </div>
                      {selected && <Check size={16} color="#6366f1" />}
                    </button>
                  );
                })}
                {pages.length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    Carregando páginas...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {renderStepIndicator()}

        <div style={{ minHeight: 400 }}>
          {step === 0 && renderStep1()}
          {step === 1 && renderStep2()}
          {step === 2 && renderStep3()}
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(15,23,42,0.08)',
        }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            onMouseEnter={(e) => { if (step > 0) { e.currentTarget.style.background = 'rgba(15,23,42,0.06)'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.12)'; }}}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', background: 'rgba(15,23,42,0.04)',
              border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12,
              color: '#94a3b8', cursor: step > 0 ? 'pointer' : 'default',
              fontSize: 14, opacity: step > 0 ? 1 : 0.4, transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              minHeight: 44,
            }}
          >
            <ChevronLeft size={16} /> Voltar
          </button>

          <button onClick={fillDefaults}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)'; }}
            style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: 'rgba(15,23,42,0.04)',
            border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12,
            color: '#6366f1', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', minHeight: 44,
          }}>
            <Sparkles size={16} /> Preencher Defaults Recomendados
          </button>

          <button
            disabled={submitting}
            onClick={() => {
              if (step < 2) setStep(s => s + 1);
              else handleSubmit();
            }}
            onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.boxShadow = '0 6px 24px rgba(99,102,241,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 12, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600, boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', minHeight: 44,
            }}
          >
            {submitting ? (<><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Criando...</>) :
             step < 2 ? (<>Próximo <ChevronRight size={16} /></>) : (<><Check size={16} /> Criar Campanha</>)}
          </button>
        </div>

        {/* Status messages */}
        {submitError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12 }}>
            <AlertTriangle size={16} color="#f87171" />
            <span style={{ fontSize: 13, color: '#f87171' }}>{submitError}</span>
          </div>
        )}
        {submitSuccess && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '12px 16px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12 }}>
            <Check size={16} color="#4ade80" />
            <span style={{ fontSize: 13, color: '#4ade80' }}>{submitSuccess}</span>
          </div>
        )}
      </div>
    </div>
  );
}
