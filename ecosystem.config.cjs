module.exports = {
  apps: [{
    name: 'bellor-api',
    script: 'apps/api/dist/app.js',
    cwd: '/opt/bellor',
    node_args: '--max-old-space-size=384',
    max_memory_restart: '350M',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/home/ubuntu/.pm2/logs/bellor-api-error.log',
    out_file: '/home/ubuntu/.pm2/logs/bellor-api-out.log',
  }],
};
