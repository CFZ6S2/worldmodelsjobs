module.exports = {
  apps: [{
    name: "whatsapp-v6",
    script: "./whatsapp_collector.js",
    cwd: "/root/worldmodels-jobs/collectors/whatsapp/",
    args: "--qrcode",
    restart_delay: 10000,
    max_restarts: 10,
    exp_backoff_restart_delay: 100,
    env: {
      NODE_ENV: "production"
    }
  }]
}
