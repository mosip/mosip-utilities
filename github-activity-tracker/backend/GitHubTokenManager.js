const axios = require('axios');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Minimum remaining requests before hitting the GitHub API rate limit.
const RATE_LIMIT_THRESHOLD = 100;

class GitHubTokenManager {
  constructor() {
    this.tokens = [
      process.env.GITHUB_TOKEN_1 || "",
      process.env.GITHUB_TOKEN_2 || "", 
      process.env.GITHUB_TOKEN_3 || "",
      process.env.GITHUB_TOKEN_4 || "",
      process.env.GITHUB_TOKEN_5 || "",
      process.env.GITHUB_TOKEN_6 || "",
      process.env.GITHUB_TOKEN_7 || "",
      process.env.GITHUB_TOKEN_8 || "",
      process.env.GITHUB_TOKEN_9 || "",
      process.env.GITHUB_TOKEN_10 || ""
    ];
    this.tokenLimits = {};
    this.currentTokenIndex = 0;

    this.tokens.forEach((token, index) => {
      this.tokenLimits[index] = {
        remaining: null,
        resetTime: null,
        lastChecked: 0
      };
    });

    console.log(`GitHub Token Manager initialized with ${this.tokens.length} tokens`);
  }

  getCurrentToken() {
    return this.tokens[this.currentTokenIndex];
  }

  getHeaders() {
    return {
      "Accept": "application/vnd.github+json",
      "User-Agent": "github-activity-tracker/1.0",
      "X-GitHub-Api-Version": "2022-11-28",
      "Authorization": `Bearer ${this.getCurrentToken()}`
    };
  }

  async checkCurrentTokenLimit() {
    const tokenIndex = this.currentTokenIndex;
    const tokenLimit = this.tokenLimits[tokenIndex];
    const now = Date.now();
    console.log("Check next token " + tokenIndex);
    if (now - tokenLimit.lastChecked > 30000 || 
        (tokenLimit.resetTime && now >= tokenLimit.resetTime * 1000)) {
      try {
        const headers = this.getHeaders();
        const response = await axios.get("https://api.github.com/rate_limit", { headers });
        this.tokenLimits[tokenIndex] = {
          remaining: parseInt(response.data.resources.core.remaining, 10),
          resetTime: parseInt(response.data.resources.core.reset, 10),
          lastChecked: now
        };
        console.log(`Token ${tokenIndex + 1} rate limit: ${this.tokenLimits[tokenIndex].remaining} remaining, reset at ${new Date(this.tokenLimits[tokenIndex].resetTime * 1000).toISOString()}`);
      } catch (error) {
        console.error(`Error checking rate limit for token ${tokenIndex + 1}: ${error.message}`);
        this.tokenLimits[tokenIndex] = { remaining: null, resetTime: null, lastChecked: now };
      }
    }
    return this.tokenLimits[tokenIndex];
  }

  async switchToNextToken() {
    console.log("Switch to next token from " + this.currentTokenIndex);
    const originalIndex = this.currentTokenIndex;
    for (let i = 0; i < this.tokens.length; i++) {
      this.currentTokenIndex = (this.currentTokenIndex + 1) % this.tokens.length;
      const tokenLimit = await this.checkCurrentTokenLimit();
      if (tokenLimit.remaining === null || tokenLimit.remaining > 20) {
        console.log(`Switched from token ${originalIndex + 1} to token ${this.currentTokenIndex + 1} (${tokenLimit.remaining} remaining)`);
        return true;
      }
    }
    const earliestReset = Math.min(
      ...Object.values(this.tokenLimits)
        .filter(tl => tl.resetTime)
        .map(tl => tl.resetTime * 1000)
    );
    if (earliestReset) {
      const waitTime = Math.max(earliestReset - Date.now(), 0) + 5000;
      console.log(`All tokens exhausted. Waiting ${Math.ceil(waitTime / 1000)}s for reset...`);
      await sleep(waitTime);
      Object.keys(this.tokenLimits).forEach(index => {
        this.tokenLimits[index].lastChecked = 0;
      });
      return true;
    }
    return false;
  }

  async handleRateLimit() {
    const tokenLimit = await this.checkCurrentTokenLimit();
    console.log("handleRateLimit: ", tokenLimit);
    if (tokenLimit.remaining !== null && tokenLimit.remaining < RATE_LIMIT_THRESHOLD || tokenLimit.remaining === null) {
      return await this.switchToNextToken();
    }
    return false;
  }
}

module.exports = GitHubTokenManager;