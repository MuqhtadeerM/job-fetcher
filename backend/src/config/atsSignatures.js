// A single source of truth describing how to recognize each supported ATS.
// `hostnameIncludes`: if the career URL's hostname contains any of these
//   substrings, we can identify the ATS with zero network calls.
// `htmlIncludes`: if we have to fetch the page, these are substrings we
//   search for in the raw HTML — typically leftover script/iframe URLs
//   pointing back at the ATS vendor's own domain.
const ATS_SIGNATURES = {
  greenhouse: {
    hostnameIncludes: ["greenhouse.io"],
    htmlIncludes: ["boards.greenhouse.io", "greenhouse.io/embed"],
  },
  lever: {
    hostnameIncludes: ["lever.co"],
    htmlIncludes: ["jobs.lever.co"],
  },
  workday: {
    hostnameIncludes: ["myworkdayjobs.com"],
    htmlIncludes: ["myworkdayjobs.com"],
  },
  ashby: {
    hostnameIncludes: ["ashbyhq.com"],
    htmlIncludes: ["ashbyhq.com"],
  },
  smartrecruiters: {
    hostnameIncludes: ["smartrecruiters.com"],
    htmlIncludes: ["smartrecruiters.com"],
  },
  recruitee: {
    hostnameIncludes: ["recruitee.com"],
    htmlIncludes: ["recruitee.com"],
  },
  teamtailor: {
    hostnameIncludes: ["teamtailor.com"],
    htmlIncludes: ["teamtailor.com"],
  },
  bamboohr: {
    hostnameIncludes: ["bamboohr.com"],
    htmlIncludes: ["bamboohr.com"],
  },
};

export default ATS_SIGNATURES;
