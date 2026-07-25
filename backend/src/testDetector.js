import detectATS from "./services/atsDetector.js";

const testUrls = [
  "https://boards.greenhouse.io/airbnb", // should hit hostname match, high confidence
  "https://www.nice.com/careers", // should require HTML fetch
  "https://careers.adobe.com", // should require HTML fetch
];

(async () => {
  for (const url of testUrls) {
    const result = await detectATS(url);
    console.log(url, "→", result);
  }
})();
