def execute_query(conn, query):
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query)
    results = cursor.fetchall()
    return results

def execute_explain(conn, query):
    """
    Executes MySQL EXPLAIN on the SELECT query to retrieve performance analysis.
    """
    try:
        cursor = conn.cursor(dictionary=True)
        explain_query = f"EXPLAIN {query}"
        cursor.execute(explain_query)
        results = cursor.fetchall()
        return results
    except Exception as e:
        return [{"error": str(e)}]