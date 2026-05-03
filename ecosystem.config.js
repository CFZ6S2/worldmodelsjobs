const path = require('path');

module.exports = {
  apps: [
    {
      name: 'worldmodels-backend',
      script: './server.js',
      cwd: path.resolve(__dirname),
      env: { NODE_ENV: 'production' },
      max_restarts: 10,
      restart_delay: 5000
    },

    {
      name: 'worldmodels-web',
      script: 'npm',
      args: 'start',
      cwd: path.resolve(__dirname, 'web'),
      env: { NODE_ENV: 'production', PORT: 3000 },
      max_restarts: 10,
      restart_delay: 5000
    }
  ]
};
