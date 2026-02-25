/**
 * Sync behaviour configuration (e.g. delays to reduce GitHub rate-limit risk).
 */

/** Delay in ms between processing each repo when syncing commits/PRs/reviews for all repos. */
const DELAY_BETWEEN_REPOS_MS = 300;

module.exports = {
  DELAY_BETWEEN_REPOS_MS,
};
