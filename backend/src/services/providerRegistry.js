import fetchGreenhouseJobs from "../providers/greenhouseProvider.js";

// A stub for providers we haven't built yet. Calling it throws a clear,
// specific error rather than the registry silently returning `undefined`,
// which would cause a much more confusing crash later ("undefined is not
// a function") when the orchestrator tries to call it.
function notImplemented(providerName) {
  return async () => {
    throw new Error(`Provider "${providerName}" is not implemented yet`);
  };
}

// The registry: maps each ATS name (matching our Job schema's `ats` enum
// from Step 5, and the detector's output from Step 8) to the function
// that knows how to fetch+normalize jobs for it.
const providerRegistry = {
  greenhouse: fetchGreenhouseJobs,
  lever: notImplemented("lever"),
  workday: notImplemented("workday"),
  ashby: notImplemented("ashby"),
  smartrecruiters: notImplemented("smartrecruiters"),
  recruitee: notImplemented("recruitee"),
  teamtailor: notImplemented("teamtailor"),
  bamboohr: notImplemented("bamboohr"),
  generic: notImplemented("generic"), // built in a later step (HTML/Puppeteer scraper)
};

/**
 * Looks up the correct provider function for a given ATS name.
 * Centralizing this lookup (instead of accessing providerRegistry[ats]
 * directly everywhere) means we can add validation/logging here once,
 * in one place, rather than repeating it at every call site.
 */
function getProvider(ats) {
  const provider = providerRegistry[ats];
  if (!provider) {
    // This only happens if `ats` is a string that doesn't exist in the
    // registry at all — different from "not implemented yet," which we
    // handle above. This would indicate a bug elsewhere (e.g. detector
    // returning a typo'd ats name).
    throw new Error(`No provider registered for ATS: "${ats}"`);
  }
  return provider;
}

export { providerRegistry, getProvider };
