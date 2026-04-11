module.exports = {
  apps: [
    {
      name: "whapi-gateway",
      script: "./whapi_gateway.js",
      cwd: "/root/worldmodels-jobs/",
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        PORT: 8080
      }
    }
  ]
}
