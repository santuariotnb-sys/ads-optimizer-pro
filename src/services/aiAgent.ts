import type { DashboardMetrics, Campaign } from '../types/meta';

interface AgentContext {
  metrics: DashboardMetrics;
  campaigns: Campaign[];
  emqScore: number;
}

export class AIAgent {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(userMessage: string, context: AgentContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao comunicar com o agente IA');
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private buildSystemPrompt(context: AgentContext): string {
    return `Você é um especialista em Meta Ads (Facebook/Instagram) com conhecimento profundo sobre:
- Andromeda (retrieval engine), GEM (ranking model), Entity ID clustering
- Signal Engineering e CAPI (Conversions API)
- Otimização de criativos, hooks e novelty bias
- Estratégias de lance e budget

Dados atuais da conta:
- CPA: R$ ${context.metrics.cpa.toFixed(2)}
- ROAS: ${context.metrics.roas.toFixed(2)}x
- CTR: ${context.metrics.ctr.toFixed(2)}%
- CPM: R$ ${context.metrics.cpm.toFixed(2)}
- Investimento: R$ ${context.metrics.spend.toLocaleString('pt-BR')}
- Conversões: ${context.metrics.conversions}
- Score da Conta: ${context.metrics.accountScore}/100
- EMQ: ${context.emqScore}/10
- Campanhas ativas: ${context.campaigns.filter(c => c.status === 'ACTIVE').length}

Responda sempre em português brasileiro. Seja direto, prático e baseado em dados.`;
  }
}
