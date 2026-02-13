/**
 * ACTION AUTHORITY - DEMO MODE CONFIGURATION
 *
 * This configuration bypasses the 400ms hold during fast demo sequences
 * but enables full governance showcase when deliberately triggered.
 *
 * Used during professional demo recording for Fiverr.
 */

export const AA_DEMO_MODE_CONFIG = {
  // ═══════════════════════════════════════════════════════════════════
  // DEMO MODE ACTIVATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Enable demo mode: disables 400ms hold during fast sequences
   */
  demoMode: true,

  /**
   * Demo context for logging/analytics
   */
  demoContext: {
    isRecording: true,
    appName: '', // Will be set per app (paper-perfector, data-blaster, etc.)
    recordingTimestamp: Date.now(),
    purpose: 'professional-demo'
  },

  // ═══════════════════════════════════════════════════════════════════
  // HOLD TIME CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * In demo mode: 0ms hold (instant action verification)
   * In normal mode: 400ms hold (user deliberation time)
   */
  holdTime: {
    demoMode: 0,        // No hold during demo
    normalMode: 400,    // Standard 400ms hold
    current: 0          // Will be set based on demoMode
  },

  /**
   * Auto-show HUD: false during fast sequences, true during showcase
   */
  autoShowHUD: false,

  /**
   * Governance panel visibility: controlled by scene triggers
   */
  governancePanelVisible: false,

  // ═══════════════════════════════════════════════════════════════════
  // TRIGGER CONFIGURATION FOR DEMO SHOWCASE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Scene type that triggers Action Authority showcase
   */
  showCaseSceneAction: 'SHOW_ACTION_AUTHORITY',

  /**
   * When triggered, show these elements:
   */
  showcaseElements: {
    showGovernancePanel: true,
    showVerificationStatus: true,
    showPolicyEvaluation: true,
    highlightSafetyFeatures: true,
    showAuditLog: false // Audit log too detailed for fast demo
  },

  /**
   * Governance levels to display
   */
  governanceLevels: {
    level1_authentication: true,
    level2_policyValidation: true,
    level3_compliance: true,
    level4_contextualReasoning: false // Too complex for demo
  },

  /**
   * Policy categories to display during showcase
   */
  policyCategories: {
    preventPII: true,
    preventDestructive: true,
    preventExternalCalls: false,
    preventUnauthorizedAccess: true,
    custom: false
  },

  // ═══════════════════════════════════════════════════════════════════
  // PERFORMANCE OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Skip expensive checks during demo
   */
  performance: {
    skipAuditLogPersistence: true,      // Don't write to local storage during demo
    skipMerkleTreeUpdate: true,          // Skip cryptographic proof generation
    skipRemoteSync: true,                // Don't sync to server during demo
    cacheResults: true                   // Cache policy evaluations
  },

  // ═══════════════════════════════════════════════════════════════════
  // STYLING FOR DEMO SHOWCASE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Visual styling during showcase moments
   */
  showcaseStyle: {
    panelBackground: 'rgba(20, 30, 60, 0.95)',  // Dark blue, semi-transparent
    textColor: '#FFFFFF',                        // White text
    accentColor: '#00D9FF',                      // Cyan accent
    highlightColor: 'rgba(0, 217, 255, 0.2)',   // Cyan highlight
    borderColor: '#00D9FF',                      // Cyan border
    fontSize: '14px',
    borderRadius: '8px',
    animation: 'fadeInScale 0.4s ease-out'      // Smooth appear animation
  },

  /**
   * Narration timing for showcase moments
   */
  showcaseTiming: {
    panelAppearDelay: 200,     // 200ms after scene starts
    highlightDuration: 3000,   // Show for 3 seconds
    fadeOutDuration: 500       // 500ms fade out
  },

  // ═══════════════════════════════════════════════════════════════════
  // LOGGING & DEBUGGING
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Enable detailed logging during demo
   */
  logging: {
    enableDebugLogs: true,
    logAllPolicyEvaluations: false,  // Too verbose
    logShowcaseMoments: true,
    logHoldSkips: true
  },

  // ═══════════════════════════════════════════════════════════════════
  // FACTORY FUNCTION: Configure per app
  // ═══════════════════════════════════════════════════════════════════
};

/**
 * Create app-specific Action Authority demo config
 */
export function createAADemoConfig(appName: string, options?: Partial<typeof AA_DEMO_MODE_CONFIG>) {
  const config = { ...AA_DEMO_MODE_CONFIG };

  config.demoContext.appName = appName;
  config.holdTime.current = config.demoMode ? config.holdTime.demoMode : config.holdTime.normalMode;

  // Merge any custom options
  if (options) {
    return { ...config, ...options };
  }

  return config;
}

/**
 * Toggle demo mode on/off
 */
export function toggleDemoMode(config: typeof AA_DEMO_MODE_CONFIG, enabled: boolean) {
  config.demoMode = enabled;
  config.holdTime.current = enabled ? config.holdTime.demoMode : config.holdTime.normalMode;
  config.autoShowHUD = !enabled; // Show HUD in normal mode
  return config;
}

/**
 * Trigger Action Authority showcase (call during SHOW_ACTION_AUTHORITY scene)
 */
export function triggerAAShowcase(config: typeof AA_DEMO_MODE_CONFIG) {
  return {
    ...config,
    autoShowHUD: true,
    governancePanelVisible: true,
    showcaseElements: { ...config.showcaseElements, showGovernancePanel: true }
  };
}

export default AA_DEMO_MODE_CONFIG;
