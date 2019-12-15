// next.config.js
module.exports = {
  target: "server",
  env: {
    API_BASE:
      process.env.NODE_ENV === "production"
        ? "/api"
        : "https://defjosiah.com/api"
  }
};
