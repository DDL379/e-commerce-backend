export default function errorMiddleware(err, req, res, next) {
  if (err.name === "ZodError") {
    return res.status(400).json({
      sucess: false,
      errors: err.iussues,
    });
  }
  res.status(err.status || 500);
  res.json({
    status: err.status || 500,
    message: err.message || "Server Error!!",
  });
}
