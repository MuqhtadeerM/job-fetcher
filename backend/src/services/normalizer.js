// Shared helpers that ANY provider's normalization logic can reuse.
// None of this is Greenhouse-specific — it's general text/date handling
// that comes up across every ATS.

/**
 * Given a free-text location string (e.g. "Remote", "San Francisco, CA, US",
 * "Remote - US"), guesses whether the role is remote.
 */
function isRemote(locationText = "") {
  if (!locationText) return false;
  // .toLowerCase() so this works regardless of how the source capitalizes it.
  // .includes() checks for the substring "remote" anywhere in the string.
  return locationText.toLowerCase().includes("remote");
}

/**
 * Attempts to split a combined "City, Country" or "City, State, Country"
 * style string into separate city/country fields. This is intentionally
 * simple (not a full geocoding solution) — good enough for display and
 * filtering purposes, which is all our schema needs.
 */
function splitLocation(locationText = "") {
  if (!locationText) {
    return { city: null, country: null };
  }

  // .split(',') breaks "San Francisco, CA, US" into
  // ["San Francisco", " CA", " US"]. .map(s => s.trim()) removes the
  // leading spaces left behind by the split, giving a clean array.
  const parts = locationText.split(",").map((part) => part.trim());

  return {
    city: parts[0] || null,
    // The LAST element is usually the country in most ATS location strings
    // (e.g. "City, State, Country"). If there's only one part (e.g. just
    // "Remote"), city and country would end up being the same single value —
    // we guard against that below.
    country: parts.length > 1 ? parts[parts.length - 1] : null,
  };
}

/**
 * Safely converts a date string/value into a JS Date object, or null
 * if it's missing/invalid. We never want a bad date string to crash
 * the whole normalization process for one job.
 */
function safeParseDate(dateValue) {
  if (!dateValue) return null;
  const parsed = new Date(dateValue);
  // Date's own built-in validity check: an invalid date's getTime()
  // returns NaN, and NaN is the only JS value that is never equal to itself —
  // this is the standard idiom for "is this a valid Date object."
  return isNaN(parsed.getTime()) ? null : parsed;
}

export { isRemote, splitLocation, safeParseDate };
