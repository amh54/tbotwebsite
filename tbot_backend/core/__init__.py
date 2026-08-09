import pymysql

# Django's MySQL backend checks MySQLdb version metadata.
# PyMySQL provides a MySQLdb-compatible interface but reports its own version.
# Override the reported version so Django 6 accepts the adapter on platforms
# where native mysqlclient cannot be compiled (e.g., Vercel).
pymysql.version_info = (2, 2, 7, "final", 0)
pymysql.__version__ = "2.2.7"
pymysql.install_as_MySQLdb()
