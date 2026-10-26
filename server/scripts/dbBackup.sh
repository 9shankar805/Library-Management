#!/usr/bin/env bash
# ==============================================================================
# Central Library Management System — Automated PostgreSQL Backup & Restore
# ==============================================================================

set -euo pipefail

export PATH="/home/mrp/.local/pgsql/usr/lib/postgresql/17/bin:$PATH"
export LD_LIBRARY_PATH="/home/mrp/.local/pgsql/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

BACKUP_DIR="${BACKUP_DIR:-$HOME/library_backups}"
mkdir -p "$BACKUP_DIR"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-library_management}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/library_backup_${TIMESTAMP}.sql.gz"

usage() {
    echo "Usage: $0 {backup|restore <file>|list}"
    exit 1
}

do_backup() {
    echo "📦 Starting automated database backup for '${DB_NAME}'..."
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"
    echo "✅ Backup successfully created: ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"
    
    # Retention: keep last 7 daily backups, delete older ones
    find "$BACKUP_DIR" -type f -name "library_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null || true
    echo "🧹 Retention policy enforced (older backups purged)."
}

do_list() {
    echo "📋 Available Database Backups in ${BACKUP_DIR}:"
    ls -lh "${BACKUP_DIR}"/library_backup_*.sql.gz 2>/dev/null || echo "No backups found."
}

do_restore() {
    local target_file="${1:-}"
    if [[ -z "$target_file" || ! -f "$target_file" ]]; then
        echo "❌ Error: Specify an existing backup file to restore."
        exit 1
    fi
    echo "⚠️ Restoring database '${DB_NAME}' from ${target_file}..."
    gunzip -c "$target_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    echo "✅ Database restore completed successfully."
}

case "${1:-}" in
    backup)
        do_backup
        ;;
    list)
        do_list
        ;;
    restore)
        do_restore "${2:-}"
        ;;
    *)
        usage
        ;;
esac
