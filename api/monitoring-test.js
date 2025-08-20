/**
 * Simple test endpoint for monitoring
 */

module.exports = (req, res) => {
  res.json({
    message: "Monitoring endpoint is working!",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    project: "SA_Student_Companion",
    method: req.method,
    url: req.url,
  });
};

