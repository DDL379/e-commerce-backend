export const validateBody = (schema) => (req, res, next) => {
  schema.parse(req.body);
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  schema.parse(req.query);
  next();
};

export const validateParams = (schema) => (req, res, next) => {
  schema.parse(req.params);
  next();
};

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    console.error("❌ Zod Raw Error:", JSON.stringify(error, null, 2));

    const details = (error.issues || []).map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));

    const finalDetails =
      details.length > 0
        ? details
        : [{ path: "unknown", message: error.message }];

    return res.status(400).json({
      status: "error",
      message: "ข้อมูลไม่ถูกต้อง (Validation Error)",
      details: finalDetails,
    });
  }
};
