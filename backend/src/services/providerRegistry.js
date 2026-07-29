import fetchGreenhouseJobs from "../providers/greenhouseProvider.js";
import fetchLeverJobs from "../providers/leverProvider.js";
import fetchGenericJobs from "../providers/genericProvider.js";

function notImplemented(providerName) {
  return async () => {
    throw new Error(`Provider "${providerName}" is not implemented yet`);
  };
}

const providerRegistry = {
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs,
  workday: notImplemented("workday"),
  ashby: notImplemented("ashby"),
  smartrecruiters: notImplemented("smartrecruiters"),
  recruitee: notImplemented("recruitee"),
  teamtailor: notImplemented("teamtailor"),
  bamboohr: notImplemented("bamboohr"),
  generic: fetchGenericJobs, // CHANGED
};

function getProvider(ats) {
  const provider = providerRegistry[ats];
  if (!provider) {
    throw new Error(`No provider registered for ATS: "${ats}"`);
  }
  return provider;
}

export { providerRegistry, getProvider };
