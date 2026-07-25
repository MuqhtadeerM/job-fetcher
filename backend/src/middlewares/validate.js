// A HIGHER-ORDER FUNCTION: a function that takes arguments and RETURNS
// another function. Here, `validate` takes a Joi schema and a "source"
// (which part of the request to validate: 'query', 'params', or 'body'),
// and returns an actual Express middleware function configured for that
// specific schema/source combination.
//
// Why do it this way instead of writing separate middleware for every
// single route? Because the validation LOGIC is identical every time —
// only the schema and the request part being checked change. Writing it
// once, generically, and reusing it everywhere avoids duplicating the
// same try/catch-like logic across a dozen route files.
function validate(schema, source = "query") {
  return (req, res, next) => {
    // req[source] dynamically accesses req.query, req.params, or req.body
    // depending on what the caller of `validate()` specified.
    const dataToValidate = req[source];

    // schema.validate() runs the Joi schema against the incoming data.
    // { abortEarly: false } tells Joi to collect ALL validation errors,
    // not just stop at the first one — much more useful feedback for
    // whoever is calling our API (e.g. "page must be a number" AND
    // "employmentType must be one of [...]" reported together).
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
    });

    if (error) {
      // error.details is an array of individual validation failures.
      // We map it down to just the human-readable messages, since the
      // full Joi error object contains a lot of internal detail the
      // API consumer doesn't need.
      const messages = error.details.map((detail) => detail.message);
      return res
        .status(400)
        .json({ error: "Validation failed", details: messages });
    }

    // `value` is the VALIDATED (and Joi-transformed) data — this includes
    // defaults Joi applied (e.g. page=1 if not provided) and type coercion
    // (e.g. the query string "20" becomes the actual number 20).
    // We overwrite req[source] with this cleaned-up version, so the
    // controller downstream always receives trustworthy, correctly-typed data.
    req.validated = {
      ...(req.validated || {}),
      [source]: value,
    };

    // next() hands control to the next middleware/route handler in the chain.
    // Without calling this, the request would simply hang forever.
    next();
  };
}

export default validate;
