import React, { useState, useRef, useMemo } from 'react';
import {
  Image,
  Video,
  Layers,
  Upload,
  Globe,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface AdStepProps {
  form: {
    name: string;
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
  };
  onChange: (key: string, value: unknown) => void;
  pages: { id: string; name: string; picture: string }[];
  mode: 'demo' | 'live';
}

const inputBase: React.CSSProperties = {
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
};

const inputFocusPartial: React.CSSProperties = {
  borderColor: '#6366f1',
  boxShadow: '0 0 12px rgba(99,102,241,0.15)',
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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: 16,
  paddingBottom: 8,
  borderBottom: '1px solid rgba(15,23,42,0.08)',
};

const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\") no-repeat right 16px center";

const CTA_OPTIONS = [
  { label: 'Saiba Mais', value: 'LEARN_MORE' },
  { label: 'Comprar', value: 'SHOP_NOW' },
  { label: 'Inscreva-se', value: 'SIGN_UP' },
  { label: 'Fale Conosco', value: 'CONTACT_US' },
  { label: 'Baixar', value: 'DOWNLOAD' },
  { label: 'Reservar', value: 'BOOK_TRAVEL' },
  { label: 'Assistir', value: 'WATCH_MORE' },
  { label: 'Candidatar-se', value: 'APPLY_NOW' },
  { label: 'Obter Oferta', value: 'GET_OFFER' },
];

const FORMAT_OPTIONS: { key: 'image' | 'video' | 'carousel'; label: string; icon: React.ReactNode }[] = [
  { key: 'image', label: 'Imagem', icon: <Image size={20} /> },
  { key: 'video', label: 'Vídeo', icon: <Video size={20} /> },
  { key: 'carousel', label: 'Carrossel', icon: <Layers size={20} /> },
];

function useFocusStyle(
  base: React.CSSProperties,
): [React.CSSProperties, { onFocus: () => void; onBlur: () => void }] {
  const [focused, setFocused] = useState(false);
  const style: React.CSSProperties = focused ? { ...base, ...inputFocusPartial } : base;
  return [style, { onFocus: () => setFocused(true), onBlur: () => setFocused(false) }];
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  style: extraStyle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [style, handlers] = useFocusStyle(inputBase);
  return (
    <div style={{ marginBottom: 16, ...extraStyle }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...style, ...(icon ? { paddingLeft: 42 } : {}) }}
          {...handlers}
        />
      </div>
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [style, handlers] = useFocusStyle({ ...inputBase, resize: 'vertical' as const });
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={style}
        {...handlers}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}) {
  const [style, handlers] = useFocusStyle({
    ...inputBase,
    appearance: 'none' as const,
    cursor: 'pointer',
    background: `rgba(15,23,42,0.03) ${selectChevron}`,
    paddingRight: 40,
  });
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={style} {...handlers}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function AdStep({ form, onChange, pages }: AdStepProps) {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [trackingExpanded, setTrackingExpanded] = useState(true);

  const ctaLabel = useMemo(() => {
    const found = CTA_OPTIONS.find((o) => o.value === form.ctaType);
    return found?.label ?? 'Saiba Mais';
  }, [form.ctaType]);

  const previewUrl = useMemo(() => {
    if (!form.destinationUrl) return '';
    const params = new URLSearchParams();
    if (form.utmSource) params.set('utm_source', form.utmSource);
    if (form.utmMedium) params.set('utm_medium', form.utmMedium);
    if (form.utmCampaign) params.set('utm_campaign', form.utmCampaign);
    if (form.utmContent) params.set('utm_content', form.utmContent);
    if (form.utmTerm) params.set('utm_term', form.utmTerm);
    const qs = params.toString();
    return qs ? `${form.destinationUrl}?${qs}` : form.destinationUrl;
  }, [form.destinationUrl, form.utmSource, form.utmMedium, form.utmCampaign, form.utmContent, form.utmTerm]);

  const selectedPage = pages.find((p) => p.id === form.pageId);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      onChange('media', file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange('media', file);
  };

  const formContent = (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Section 1 — Identidade */}
      <div style={{ marginBottom: 32 }}>
        <div style={sectionTitleStyle}>Identidade</div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Página do Facebook</label>
          {pages.length === 0 ? (
            <div
              style={{
                ...inputBase,
                color: '#94a3b8',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Globe size={16} />
              Conecte uma página no Meta Business Suite
            </div>
          ) : (
            <SelectField
              label=""
              value={form.pageId}
              onChange={(v) => onChange('pageId', v)}
              options={pages.map((p) => ({ label: p.name, value: p.id }))}
              placeholder="Selecione uma página"
            />
          )}
        </div>
        {pages.length > 0 && (
          <InputField
            label="Conta do Instagram"
            value={form.instagramAccountId}
            onChange={(v) => onChange('instagramAccountId', v)}
            placeholder="ID da conta (opcional)"
          />
        )}
      </div>

      {/* Section 2 — Configuração do Criativo */}
      <div style={{ marginBottom: 32 }}>
        <div style={sectionTitleStyle}>Configuração do Criativo</div>

        {/* Toggle pills */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Tipo</label>
          <div
            style={{
              display: 'flex',
              gap: 0,
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid rgba(15,23,42,0.1)',
              width: 'fit-content',
            }}
          >
            {(['new', 'existing_post'] as const).map((t) => {
              const active = form.creativeType === t;
              return (
                <button
                  key={t}
                  onClick={() => onChange('creativeType', t)}
                  style={{
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? '#6366f1' : 'rgba(15,23,42,0.03)',
                    color: active ? '#fff' : '#64748b',
                    transition: 'all 0.2s',
                  }}
                >
                  {t === 'new' ? 'Criar Novo' : 'Usar Post Existente'}
                </button>
              );
            })}
          </div>
        </div>

        {form.creativeType === 'existing_post' ? (
          <InputField
            label="ID do Post"
            value={form.existingPostId}
            onChange={(v) => onChange('existingPostId', v)}
            placeholder="Cole o ID do post existente"
          />
        ) : (
          <>
            {/* Format cards */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Formato</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {FORMAT_OPTIONS.map((f) => {
                  const active = form.format === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => onChange('format', f.key)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        padding: '16px 12px',
                        borderRadius: 12,
                        border: active
                          ? '2px solid #6366f1'
                          : '1px solid rgba(15,23,42,0.1)',
                        background: active
                          ? 'rgba(99,102,241,0.04)'
                          : 'rgba(15,23,42,0.02)',
                        cursor: 'pointer',
                        color: active ? '#6366f1' : '#64748b',
                        fontSize: 12,
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        boxShadow: active
                          ? '0 0 16px rgba(99,102,241,0.12)'
                          : 'none',
                      }}
                    >
                      {f.icon}
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Media drop zone */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Mídia</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                style={{
                  border: isDragOver
                    ? '2px solid #6366f1'
                    : '2px dashed rgba(15,23,42,0.15)',
                  borderRadius: 12,
                  padding: '32px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  background: isDragOver
                    ? 'rgba(99,102,241,0.04)'
                    : 'rgba(15,23,42,0.02)',
                  transition: 'all 0.2s',
                }}
              >
                <Upload size={24} color={isDragOver ? '#6366f1' : '#94a3b8'} />
                {form.media ? (
                  <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                    {form.media.name}
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>
                    Arraste ou clique para enviar
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Section 3 — Texto e Criativo */}
      <div style={{ marginBottom: 32 }}>
        <div style={sectionTitleStyle}>Texto e Criativo</div>
        <TextareaField
          label="Texto Principal"
          value={form.primaryText}
          onChange={(v) => onChange('primaryText', v)}
          placeholder="O texto que aparece acima da mídia..."
          rows={3}
        />
        <InputField
          label="Título"
          value={form.headline}
          onChange={(v) => onChange('headline', v)}
          placeholder="Headline principal do anúncio"
        />
        <InputField
          label="Descrição"
          value={form.description}
          onChange={(v) => onChange('description', v)}
          placeholder="Descrição complementar (opcional)"
        />
        <SelectField
          label="Call to Action"
          value={form.ctaType}
          onChange={(v) => onChange('ctaType', v)}
          options={CTA_OPTIONS}
        />
      </div>

      {/* Section 4 — Destino */}
      <div style={{ marginBottom: 32 }}>
        <div style={sectionTitleStyle}>Destino</div>
        <InputField
          label="URL de Destino"
          value={form.destinationUrl}
          onChange={(v) => onChange('destinationUrl', v)}
          placeholder="https://seusite.com/lp"
          icon={<Globe size={16} />}
        />
        <InputField
          label="URL de Exibição"
          value={form.displayUrl}
          onChange={(v) => onChange('displayUrl', v)}
          placeholder="seusite.com"
        />
      </div>

      {/* Section 5 — Rastreamento */}
      <div style={{ marginBottom: 32 }}>
        <div
          onClick={() => setTrackingExpanded(!trackingExpanded)}
          style={{
            ...sectionTitleStyle,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
          }}
        >
          Rastreamento
          {trackingExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {trackingExpanded && (
          <>
            <InputField
              label="Pixel ID"
              value={form.trackingPixelId}
              onChange={(v) => onChange('trackingPixelId', v)}
              placeholder="ID do pixel de rastreamento"
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12,
              }}
            >
              <InputField
                label="UTM Source"
                value={form.utmSource}
                onChange={(v) => onChange('utmSource', v)}
                placeholder="facebook"
              />
              <InputField
                label="UTM Medium"
                value={form.utmMedium}
                onChange={(v) => onChange('utmMedium', v)}
                placeholder="cpc"
              />
              <InputField
                label="UTM Campaign"
                value={form.utmCampaign}
                onChange={(v) => onChange('utmCampaign', v)}
                placeholder="Nome da campanha"
              />
              <InputField
                label="UTM Content"
                value={form.utmContent}
                onChange={(v) => onChange('utmContent', v)}
                placeholder="Identificador do criativo"
              />
              <InputField
                label="UTM Term"
                value={form.utmTerm}
                onChange={(v) => onChange('utmTerm', v)}
                placeholder="Termo (opcional)"
              />
            </div>

            {/* URL Preview */}
            {previewUrl && (
              <div style={{ marginTop: 8 }}>
                <label style={{ ...labelStyle, fontSize: 11 }}>Preview da URL Final</label>
                <div
                  style={{
                    background: 'rgba(15,23,42,0.04)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#64748b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(15,23,42,0.06)',
                  }}
                >
                  {previewUrl}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const previewCard = (
    <div
      style={{
        width: isMobile ? '100%' : 320,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        alignSelf: 'flex-start',
        position: isMobile ? 'relative' : 'sticky',
        top: isMobile ? undefined : 24,
      }}
    >
      <div style={{ padding: '14px 16px 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Preview do Anúncio
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 10px' }}>
        {selectedPage?.picture ? (
          <img
            src={selectedPage.picture}
            alt=""
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(15,23,42,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Globe size={16} color="#94a3b8" />
          </div>
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
            {selectedPage?.name || 'Nome da Página'}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Patrocinado</div>
        </div>
      </div>

      {/* Primary text */}
      <div
        style={{
          padding: '0 16px 10px',
          fontSize: 13,
          color: '#334155',
          lineHeight: 1.5,
          minHeight: 20,
        }}
      >
        {form.primaryText || (
          <span style={{ color: '#cbd5e1' }}>Texto do anúncio...</span>
        )}
      </div>

      {/* Media placeholder */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          background: 'rgba(15,23,42,0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: '#94a3b8',
        }}
      >
        {form.media ? (
          <>
            <FileText size={28} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>{form.media.name}</span>
          </>
        ) : (
          <>
            <Image size={32} />
            <span style={{ fontSize: 12 }}>Mídia do anúncio</span>
          </>
        )}
      </div>

      {/* Headline + description + CTA */}
      <div style={{ padding: '12px 16px', background: 'rgba(15,23,42,0.02)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {form.displayUrl && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
                {form.displayUrl}
              </div>
            )}
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#0f172a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {form.headline || (
                <span style={{ color: '#cbd5e1' }}>Título do anúncio</span>
              )}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#94a3b8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {form.description || (
                <span style={{ color: '#e2e8f0' }}>Descrição</span>
              )}
            </div>
          </div>
          <div
            style={{
              flexShrink: 0,
              background: 'rgba(15,23,42,0.06)',
              borderRadius: 6,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: '#0f172a',
              whiteSpace: 'nowrap',
            }}
          >
            {ctaLabel}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 24,
        alignItems: 'flex-start',
      }}
    >
      {formContent}
      {previewCard}
    </div>
  );
}
