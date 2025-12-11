/**
 * Jest reporter that sends test results to kaytee-metrics-api.
 *
 * Results are sent to POST /results endpoint at the end of the test run.
 * API documentation: https://api.khannara.dev/docs
 *
 * Environment variables:
 * - METRICS_API_URL: API base URL (default: https://api.khannara.dev)
 * - METRICS_API_KEY: API key for authentication (required in CI)
 * - CI: Set to true in CI environments
 */
class MetricsApiReporter {
  constructor(globalConfig, reporterOptions) {
    this._globalConfig = globalConfig;
    this._options = reporterOptions;
    this.apiUrl = process.env.METRICS_API_URL || 'https://api.khannara.dev';
    this.apiKey = process.env.METRICS_API_KEY || '';
    this.projectName = reporterOptions.projectName || 'next-rbac';
  }

  onRunComplete(_contexts, results) {
    // Skip if no API key
    if (!this.apiKey) {
      console.log('[MetricsApiReporter] METRICS_API_KEY not set, skipping upload');
      return;
    }

    const payload = {
      project: this.projectName,
      test_type: 'unit',
      total_tests: results.numTotalTests,
      passed: results.numPassedTests,
      failed: results.numFailedTests,
      skipped: results.numPendingTests + results.numTodoTests,
      duration_ms: Date.now() - results.startTime,
      commit_sha: process.env.BUILD_SOURCEVERSION || process.env.GITHUB_SHA,
      branch: process.env.BUILD_SOURCEBRANCH || process.env.GITHUB_REF,
      trigger: process.env.CI ? 'ci' : 'manual',
    };

    console.log('[MetricsApiReporter] Sending results:', JSON.stringify(payload, null, 2));

    // Use native fetch (Node 18+) or fallback
    this.sendResults(payload)
      .then(() => console.log('[MetricsApiReporter] Results sent successfully'))
      .catch((err) => console.error('[MetricsApiReporter] Failed to send results:', err.message));
  }

  async sendResults(payload) {
    const response = await fetch(`${this.apiUrl}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }
}

module.exports = MetricsApiReporter;
