FROM mysql:latest

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} || exit 1

# Expose MySQL port
EXPOSE 3306
