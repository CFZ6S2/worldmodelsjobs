const path = require('path');

module.exports = {
  apps: [
    {
      name: "worldmodels-backend",
      script: "./server.js",
      cwd: path.resolve(__dirname),
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "whapi-gateway",
      script: "./whapi_gateway.js",
      cwd: path.resolve(__dirname),
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        PORT: 8080
      }
    }
  ]
}
