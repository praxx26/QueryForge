def get_schema(conn):
    """
    Returns string representation of schema for LLM prompting.
    """
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT table_name, column_name, data_type, is_nullable, column_key
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    ORDER BY table_name, ordinal_position;
    """

    cursor.execute(query)
    rows = cursor.fetchall()

    schema = ""
    current_table = None

    for row in rows:
        table = row.get("table_name", row.get("TABLE_NAME"))
        column = row.get("column_name", row.get("COLUMN_NAME"))
        dtype = row.get("data_type", row.get("DATA_TYPE", ""))
        key = row.get("column_key", row.get("COLUMN_KEY", ""))

        if table != current_table:
            schema += f"\nTable: {table}\nColumns: "
            current_table = table

        key_str = " (PK)" if key == "PRI" else ""
        schema += f"{column} [{dtype}{key_str}], "

    return schema

def get_detailed_schema_erd(conn):
    """
    Returns rich metadata for ERD visual diagram generation including
    foreign keys, column data types, and primary keys.
    """
    cursor = conn.cursor(dictionary=True)

    # 1. Fetch columns
    cursor.execute("""
        SELECT table_name, column_name, data_type, is_nullable, column_key
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        ORDER BY table_name, ordinal_position;
    """)
    cols = cursor.fetchall()

    tables_map = {}
    for col in cols:
        tname = col.get("table_name", col.get("TABLE_NAME"))
        cname = col.get("column_name", col.get("COLUMN_NAME"))
        dtype = col.get("data_type", col.get("DATA_TYPE"))
        is_pri = (col.get("column_key", col.get("COLUMN_KEY")) == "PRI")

        if tname not in tables_map:
            tables_map[tname] = {
                "name": tname,
                "columns": [],
                "row_count": 0
            }

        tables_map[tname]["columns"].append({
            "name": cname,
            "type": dtype,
            "is_primary": is_pri
        })

    # 2. Fetch Foreign Keys for relationships
    cursor.execute("""
        SELECT 
            TABLE_NAME as table_name,
            COLUMN_NAME as column_name,
            REFERENCED_TABLE_NAME as referenced_table,
            REFERENCED_COLUMN_NAME as referenced_column
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND REFERENCED_TABLE_NAME IS NOT NULL;
    """)
    fk_rows = cursor.fetchall()

    relationships = []
    for fk in fk_rows:
        relationships.append({
            "from_table": fk.get("table_name", fk.get("TABLE_NAME")),
            "from_column": fk.get("column_name", fk.get("COLUMN_NAME")),
            "to_table": fk.get("referenced_table", fk.get("REFERENCED_TABLE_NAME")),
            "to_column": fk.get("referenced_column", fk.get("REFERENCED_COLUMN_NAME"))
        })

    return {
        "tables": list(tables_map.values()),
        "relationships": relationships
    }

def get_table_study_context(conn):
    """
    Builds a rich context summary for Table & Schema Tutor including
    row counts, column specifications, primary keys, and indexes.
    """
    cursor = conn.cursor(dictionary=True)
    
    # Database name
    cursor.execute("SELECT DATABASE() as db;")
    db_row = cursor.fetchone()
    current_db = db_row.get("db") if db_row else "active_db"

    # Tables and basic stats
    cursor.execute("""
        SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
        FROM information_schema.tables
        WHERE TABLE_SCHEMA = DATABASE();
    """)
    tables_meta = cursor.fetchall()

    summary_lines = [f"=== DATABASE: {current_db} ==="]
    
    for t in tables_meta:
        tname = t.get("TABLE_NAME") or t.get("table_name")
        # Try getting exact row count
        exact_count = t.get("TABLE_ROWS") or 0
        try:
            cursor.execute(f"SELECT COUNT(*) as cnt FROM `{tname}`;")
            c_row = cursor.fetchone()
            if c_row:
                exact_count = c_row.get("cnt", exact_count)
        except Exception:
            pass

        summary_lines.append(f"\n[TABLE: {tname}]")
        summary_lines.append(f"- Total Rows / Records: {exact_count}")

        # Columns
        cursor.execute(f"""
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
            FROM information_schema.columns
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s
            ORDER BY ORDINAL_POSITION;
        """, (tname,))
        cols = cursor.fetchall()
        col_strs = []
        for c in cols:
            c_name = c.get("COLUMN_NAME")
            c_type = c.get("DATA_TYPE")
            c_key = " (PRIMARY KEY)" if c.get("COLUMN_KEY") == "PRI" else ""
            c_extra = f" {c.get('EXTRA')}" if c.get('EXTRA') else ""
            col_strs.append(f"  - {c_name}: {c_type}{c_key}{c_extra}")
        summary_lines.append("- Columns:\n" + "\n".join(col_strs))

        # Indexes
        try:
            cursor.execute(f"SHOW INDEX FROM `{tname}`;")
            idx_rows = cursor.fetchall()
            if idx_rows:
                idx_names = set(i.get("Key_name") or i.get("KEY_NAME") for i in idx_rows)
                summary_lines.append(f"- Existing Indexes: {', '.join(idx_names)}")
            else:
                summary_lines.append("- Existing Indexes: None")
        except Exception:
            pass

    return "\n".join(summary_lines)