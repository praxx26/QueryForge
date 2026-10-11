from database.connection import create_connection

def get_database_tables_summary(conn):
    """
    Returns summary of all tables in the current connected database,
    including row count, column count, and primary key.
    """
    cursor = conn.cursor(dictionary=True)
    
    # 1. Fetch tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    table_rows = cursor.fetchall()
    
    tables = []
    for r in table_rows:
        tname = r.get("table_name", r.get("TABLE_NAME"))
        
        # Get column details & primary key
        cursor.execute("""
            SELECT column_name, data_type, column_key
            FROM information_schema.columns
            WHERE table_schema = DATABASE() AND table_name = %s
            ORDER BY ordinal_position;
        """, (tname,))
        cols = cursor.fetchall()
        
        pk_col = None
        for col in cols:
            ck = col.get("column_key", col.get("COLUMN_KEY", ""))
            if ck == "PRI":
                pk_col = col.get("column_name", col.get("COLUMN_NAME"))
                break

        # Get exact row count safely
        try:
            cursor.execute(f"SELECT COUNT(*) as cnt FROM `{tname}`;")
            cnt_row = cursor.fetchone()
            row_count = cnt_row.get("cnt", 0) if cnt_row else 0
        except Exception:
            row_count = 0

        tables.append({
            "name": tname,
            "row_count": row_count,
            "column_count": len(cols),
            "primary_key": pk_col
        })

    return tables


def get_table_data(conn, table_name: str, page: int = 1, page_size: int = 25, search_term: str = None):
    """
    Fetches paginated rows, total count, and column schemas for the specified table.
    """
    cursor = conn.cursor(dictionary=True)

    # 1. Verify table exists in current database
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = %s;
    """, (table_name,))
    if not cursor.fetchone():
        raise ValueError(f"Table '{table_name}' does not exist in the connected database.")

    # 2. Get column metadata
    cursor.execute("""
        SELECT column_name, data_type, is_nullable, column_key, extra
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = %s
        ORDER BY ordinal_position;
    """, (table_name,))
    cols_meta = cursor.fetchall()

    columns = []
    pk_col = None
    for c in cols_meta:
        cname = c.get("column_name", c.get("COLUMN_NAME"))
        dtype = c.get("data_type", c.get("DATA_TYPE"))
        is_pri = (c.get("column_key", c.get("COLUMN_KEY")) == "PRI")
        is_null = (c.get("is_nullable", c.get("IS_NULLABLE")) == "YES")
        extra = c.get("extra", c.get("EXTRA", ""))
        is_auto_inc = "auto_increment" in str(extra).lower()

        if is_pri and not pk_col:
            pk_col = cname

        columns.append({
            "name": cname,
            "type": dtype,
            "is_primary": is_pri,
            "nullable": is_null,
            "is_auto_increment": is_auto_inc
        })

    # 3. Build query with optional search
    where_clauses = []
    params = []

    if search_term and search_term.strip():
        term = f"%{search_term.strip()}%"
        sub_clauses = []
        for col in columns:
            sub_clauses.append(f"CAST(`{col['name']}` AS CHAR) LIKE %s")
            params.append(term)
        if sub_clauses:
            where_clauses.append(f"({' OR '.join(sub_clauses)})")

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    # Total matching rows count
    count_query = f"SELECT COUNT(*) as total FROM `{table_name}` {where_sql};"
    cursor.execute(count_query, tuple(params))
    total_res = cursor.fetchone()
    total = total_res.get("total", 0) if total_res else 0

    # Fetch paginated rows
    offset = max(0, (page - 1) * page_size)
    data_query = f"SELECT * FROM `{table_name}` {where_sql} LIMIT %s OFFSET %s;"
    cursor.execute(data_query, tuple(params + [page_size, offset]))
    rows = cursor.fetchall()

    return {
        "table_name": table_name,
        "columns": columns,
        "primary_key": pk_col,
        "rows": rows,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def insert_table_row(conn, table_name: str, row_data: dict):
    """
    Safely inserts a row into the table using parameterized values.
    """
    cursor = conn.cursor(dictionary=True)

    # Validate table
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = %s;
    """, (table_name,))
    if not cursor.fetchone():
        raise ValueError(f"Table '{table_name}' does not exist.")

    # Validate column names
    cursor.execute("""
        SELECT column_name, data_type, extra 
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = %s;
    """, (table_name,))
    valid_cols = {c.get("column_name", c.get("COLUMN_NAME")): c for c in cursor.fetchall()}

    insert_cols = []
    insert_vals = []
    for col, val in row_data.items():
        if col in valid_cols:
            # Skip empty string or None for auto_increment columns
            is_auto_inc = "auto_increment" in str(valid_cols[col].get("extra", valid_cols[col].get("EXTRA", ""))).lower()
            if is_auto_inc and (val is None or val == ""):
                continue
            
            # Treat empty string as None/NULL if appropriate
            if val == "":
                val = None

            insert_cols.append(f"`{col}`")
            insert_vals.append(val)

    if not insert_cols:
        raise ValueError("No valid column values provided for insertion.")

    placeholders = ", ".join(["%s"] * len(insert_vals))
    cols_sql = ", ".join(insert_cols)
    sql = f"INSERT INTO `{table_name}` ({cols_sql}) VALUES ({placeholders});"

    cursor.execute(sql, tuple(insert_vals))
    conn.commit()
    inserted_id = cursor.lastrowid

    return {
        "success": True,
        "message": "Row inserted successfully",
        "inserted_id": inserted_id
    }


def update_table_row(conn, table_name: str, primary_key: str, primary_value: any, row_data: dict):
    """
    Safely updates a row identified by primary key using parameterized values.
    """
    cursor = conn.cursor(dictionary=True)

    # Validate table and columns
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = %s;
    """, (table_name,))
    valid_cols = {c.get("column_name", c.get("COLUMN_NAME")) for c in cursor.fetchall()}

    if primary_key not in valid_cols:
        raise ValueError(f"Invalid primary key column '{primary_key}'.")

    set_clauses = []
    set_vals = []
    for col, val in row_data.items():
        if col in valid_cols and col != primary_key:
            set_clauses.append(f"`{col}` = %s")
            set_vals.append(None if val == "" else val)

    if not set_clauses:
        raise ValueError("No columns to update.")

    sql = f"UPDATE `{table_name}` SET {', '.join(set_clauses)} WHERE `{primary_key}` = %s;"
    set_vals.append(primary_value)

    cursor.execute(sql, tuple(set_vals))
    conn.commit()

    return {
        "success": True,
        "message": "Row updated successfully",
        "rows_affected": cursor.rowcount
    }


def delete_table_row(conn, table_name: str, primary_key: str, primary_value: any):
    """
    Safely deletes a row identified by primary key using parameterized values.
    """
    cursor = conn.cursor(dictionary=True)

    # Validate table and columns
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = %s;
    """, (table_name,))
    valid_cols = {c.get("column_name", c.get("COLUMN_NAME")) for c in cursor.fetchall()}

    if primary_key not in valid_cols:
        raise ValueError(f"Invalid primary key column '{primary_key}'.")

    sql = f"DELETE FROM `{table_name}` WHERE `{primary_key}` = %s;"
    cursor.execute(sql, (primary_value,))
    conn.commit()

    return {
        "success": True,
        "message": "Row deleted successfully",
        "rows_affected": cursor.rowcount
    }
