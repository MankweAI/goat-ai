// Simple Vercel test endpoint
module.exports = (req, res) => {
  res.json({
    message: "Vercel Node.js is working!",
    timestamp: new Date().toISOString(),
    user: "sophoniagoat",
    method: req.method,
    url: req.url,
  });
};

