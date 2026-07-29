import fetchGreenhouseJobs from "../providers/greenhouseProvider.js";
import fetchLeverJobs from "../providers/leverProvider.js"; // NEW import

function notImplemented(providerName) {
  return async () => {
    throw new Error(`Provider "${providerName}" is not implemented yet`);
  };
}

const providerRegistry = {
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs, // CHANGED from notImplemented('lever') to the real provider
  workday: notImplemented("workday"),
  ashby: notImplemented("ashby"),
  smartrecruiters: notImplemented("smartrecruiters"),
  recruitee: notImplemented("recruitee"),
  teamtailor: notImplemented("teamtailor"),
  bamboohr: notImplemented("bamboohr"),
  generic: notImplemented("generic"),
};

function getProvider(ats) {
  const provider = providerRegistry[ats];
  if (!provider) {
    throw new Error(`No provider registered for ATS: "${ats}"`);
  }
  return provider;
}

export { providerRegistry, getProvider };
