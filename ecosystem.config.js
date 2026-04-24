module.exports = {
  apps: [
    {
      name: "worldmodels-backend",
      script: "./server.js",
      cwd: path.resolve(__dirname),
      env: {
        NODE_ENV: "production",
      }
    }
  ]
}
