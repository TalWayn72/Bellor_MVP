module.exports = {
  apps: [{
    name: 'bellor-api',
    script: 'apps/api/dist/app.js',
    cwd: '/opt/bellor',
    node_args: '--max-old-space-size=256 --expose-gc',
    max_memory_restart: '300M',
    restart_delay: 5000,
    max_restarts: 10,
    kill_timeout: 5000,
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/home/ubuntu/.pm2/logs/bellor-api-error.log',
    out_file: '/home/ubuntu/.pm2/logs/bellor-api-out.log',
  }],
};
