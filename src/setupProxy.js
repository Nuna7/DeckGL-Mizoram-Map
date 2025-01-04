const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/tiles",
    createProxyMiddleware({
      target: "https://tile.openstreetmap.org",
      changeOrigin: true,
      pathRewrite: { "^/tiles": "" },
    })
  );
};