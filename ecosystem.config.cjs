module.exports = {
  apps: [{
    name: 'crm',
    script: 'run.sh',
    cwd: '/var/www/crm-contracts',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    restart_delay: 2000,
    min_uptime: 10000,
    max_restarts: 20,
    // Health check: if /api/heartbeat returns non-2xx for 3 consecutive checks, restart
    healthcheck: {
      interval: 30,
      url: 'http://localhost:3000/api/auth',
      timeout: 5000,
      unhealthy_after: 2,
    },
    env: {
      NODE_ENV: 'production',
    },
  }],
}