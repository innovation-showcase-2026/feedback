import type { GitHubConfig } from '../types';

function getEnv(key: string, fallback: string): string {
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key] && String(metaEnv[key]).trim().length > 0) {
      return String(metaEnv[key]).trim();
    }
  } catch {
    // ignore
  }
  return fallback;
}

export const APP_CONFIG = {
  summitTitle: 'Technology Innovation Summit 2026',
  summitShort: 'TIS 2026',
  sessionIdPrefix: 'TIS-2026',
  feedbackPath: 'feedback',
} as const;

export const GITHUB_CONFIG: GitHubConfig = {
  owner: getEnv('VITE_GITHUB_OWNER', 'krishnakumarsabbu-prog'),
  repo: getEnv('VITE_GITHUB_REPO', 'WFTS'),
  branch: getEnv('VITE_GITHUB_BRANCH', 'main'),
  token: getEnv('VITE_GITHUB_TOKEN', ''),
};

export function isGitHubConfigured(customToken?: string): boolean {
  const token = customToken || GITHUB_CONFIG.token;
  return (
    GITHUB_CONFIG.owner.length > 0 &&
    GITHUB_CONFIG.repo.length > 0 &&
    Boolean(token && token.trim().length > 0)
  );
}

export function getGitHubConfigStatus(customToken?: string): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!GITHUB_CONFIG.owner) missing.push('owner');
  if (!GITHUB_CONFIG.repo) missing.push('repo');
  const token = customToken || GITHUB_CONFIG.token;
  if (!token) missing.push('token');
  return { configured: missing.length === 0, missing };
}
