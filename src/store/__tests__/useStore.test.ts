import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../useStore';

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      mode: 'demo',
      accessToken: null,
      adAccountId: null,
      campaigns: [],
      alerts: [],
      currentModule: 'dashboard',
      sidebarCollapsed: false,
      isLoading: false,
      selectedPeriod: '7d',
    });
  });

  it('starts in demo mode', () => {
    expect(useStore.getState().mode).toBe('demo');
  });

  it('switches to live mode when token is set', () => {
    useStore.getState().setAccessToken('test-token-123');
    expect(useStore.getState().mode).toBe('live');
    expect(useStore.getState().accessToken).toBe('test-token-123');
  });

  it('switches back to demo when token is cleared', () => {
    useStore.getState().setAccessToken('test-token');
    useStore.getState().setAccessToken(null);
    expect(useStore.getState().mode).toBe('demo');
  });

  it('toggles sidebar', () => {
    expect(useStore.getState().sidebarCollapsed).toBe(false);
    useStore.getState().toggleSidebar();
    expect(useStore.getState().sidebarCollapsed).toBe(true);
    useStore.getState().toggleSidebar();
    expect(useStore.getState().sidebarCollapsed).toBe(false);
  });

  it('sets current module', () => {
    useStore.getState().setCurrentModule('campaigns');
    expect(useStore.getState().currentModule).toBe('campaigns');
  });

  it('sets selected period', () => {
    useStore.getState().setSelectedPeriod('30d');
    expect(useStore.getState().selectedPeriod).toBe('30d');
  });

  it('dismisses alert', () => {
    const alert = {
      id: 'test-1',
      type: 'cpa',
      severity: 'critical' as const,
      title: 'Test',
      message: 'Test alert',
      timestamp: new Date().toISOString(),
      dismissed: false,
    };
    useStore.getState().setAlerts([alert]);
    useStore.getState().dismissAlert('test-1');
    expect(useStore.getState().alerts[0].dismissed).toBe(true);
  });

  it('adds chat message', () => {
    useStore.getState().addChatMessage({
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date().toISOString(),
    });
    expect(useStore.getState().chatMessages).toHaveLength(1);
  });
});
