import type { GitHubConfig, GitHubSubmitResult, StructuredFeedback } from '../types';
import { GITHUB_CONFIG } from '../config';
import { todayDateString } from '../utils/session';

const GITHUB_STORAGE_KEY = '@wf_github_custom_config';

export class GitHubRepository {
  private config: GitHubConfig;
  private readonly apiBase = 'https://api.github.com';

  constructor(config?: GitHubConfig) {
    this.config = config ?? GITHUB_CONFIG;
  }

  static async getActiveConfig(): Promise<GitHubConfig> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(GITHUB_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            owner: parsed.owner || GITHUB_CONFIG.owner,
            repo: parsed.repo || GITHUB_CONFIG.repo,
            branch: parsed.branch || GITHUB_CONFIG.branch,
            token: parsed.token || GITHUB_CONFIG.token,
          };
        }
      }
    } catch {
      // ignore
    }
    return { ...GITHUB_CONFIG };
  }

  static async saveCustomConfig(newConfig: Partial<GitHubConfig>): Promise<void> {
    try {
      const current = await GitHubRepository.getActiveConfig();
      const updated: GitHubConfig = {
        owner: newConfig.owner !== undefined ? newConfig.owner.trim() : current.owner,
        repo: newConfig.repo !== undefined ? newConfig.repo.trim() : current.repo,
        branch: newConfig.branch !== undefined ? newConfig.branch.trim() : current.branch,
        token: newConfig.token !== undefined ? newConfig.token.trim() : current.token,
      };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(GITHUB_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to save GitHub custom config:', e);
    }
  }

  async isConfigured(): Promise<boolean> {
    const cfg = await GitHubRepository.getActiveConfig();
    return Boolean(cfg.owner && cfg.repo && cfg.token && cfg.token.trim().length > 0);
  }

  sanitizeUserFolder(name: string): string {
    return (name || 'anonymous')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'general';
  }

  buildFilePath(feedback: StructuredFeedback): string {
    const userFolder = this.sanitizeUserFolder(feedback.anchorName);
    const date = todayDateString();
    return `feedback/${userFolder}/${date}/${feedback.sessionId}.json`;
  }

  async submitFeedback(feedback: StructuredFeedback): Promise<GitHubSubmitResult> {
    const activeConfig = await GitHubRepository.getActiveConfig();

    // Check if token is available
    if (!activeConfig.token || activeConfig.token.trim().length === 0) {
      // Save locally if no token provided yet
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const key = `tis_feedback_${feedback.sessionId}`;
          window.localStorage.setItem(key, JSON.stringify(feedback));
          const listKey = 'tis_feedback_sessions';
          const existingStr = window.localStorage.getItem(listKey);
          const existing = existingStr ? JSON.parse(existingStr) : [];
          if (!existing.includes(feedback.sessionId)) {
            existing.unshift(feedback.sessionId);
            window.localStorage.setItem(listKey, JSON.stringify(existing));
          }
        }
      } catch {
        // ignore
      }
      return {
        success: true,
        filePath: `local-storage/feedback/${this.sanitizeUserFolder(feedback.anchorName)}/${feedback.sessionId}.json`,
        commitSha: 'local-saved-waiting-token',
      };
    }

    // Build dedicated user folder path: feedback/<user>/<date>/<sessionId>.json
    const filePath = this.buildFilePath(feedback);
    const content = this.encodeContent(feedback);

    try {
      const url = `${this.apiBase}/repos/${activeConfig.owner}/${activeConfig.repo}/contents/${filePath}`;
      const body = {
        message: `Add feedback record: ${feedback.sessionId} by ${feedback.anchorName}`,
        branch: activeConfig.branch || 'main',
        content,
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${activeConfig.token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'WFTS-Feedback-App',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          commitSha: data.commit?.sha || 'pushed-successfully',
          filePath,
        };
      }

      if (response.status === 401) {
        return {
          success: false,
          error: 'GitHub token rejected (401 Unauthorized). The token is invalid or expired.',
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'GitHub Token Permission Error (403): Your Personal Access Token has "Read-only" access to repository contents. Please edit this token in GitHub (Settings > Developer Settings > Personal access tokens) and change "Contents" permission from "Read-only" to "Read and write".',
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: `GitHub repository "${activeConfig.owner}/${activeConfig.repo}" not found (404). Verify the username and repository name.`,
        };
      }

      if (response.status === 422) {
        const errorData = await response.json().catch(() => null);
        const msg = errorData?.message || 'Validation failed or file already exists.';
        return {
          success: false,
          error: `GitHub rejected upload: ${msg}`,
        };
      }

      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        success: false,
        error: `GitHub upload failed (${response.status}): ${errorText}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      return {
        success: false,
        error: `Network error connecting to GitHub: ${message}`,
      };
    }
  }

  private encodeContent(feedback: StructuredFeedback): string {
    const json = JSON.stringify(feedback, null, 2);
    return encodeBase64(json);
  }
}

function encodeBase64(inputStr: string): string {
  if (typeof btoa === 'function') {
    try {
      return btoa(unescape(encodeURIComponent(inputStr)));
    } catch {
      // fallback
    }
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const input = unescape(encodeURIComponent(inputStr));
  for (
    let block = 0, charCode, i = 0, map = chars;
    input.charAt(i | 0) || (map = '=', i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = input.charCodeAt((i += 3 / 4));
    if (charCode > 0xff) throw new Error('Invalid character in base64');
    block = (block << 8) | charCode;
  }
  return output;
}
