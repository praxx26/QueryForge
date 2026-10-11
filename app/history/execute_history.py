from database.history_connection import get_history_connection
import json


def save_execute_history(
    title,
    database,
    question,
    sql_query,
    explanation,
    results
):

    conn = get_history_connection()

    cursor = conn.cursor()

    query = """
    INSERT INTO execute_history
    (
        title,
        database_name,
        question,
        sql_query,
        explanation,
        results
    )
    VALUES (%s, %s, %s, %s, %s, %s)
    """

    values = (
        title,
        database,
        question,
        sql_query,
        explanation,
        str(results)
    )

    cursor.execute(query, values)

    conn.commit()

    cursor.close()

    conn.close()

def get_execute_history():
    conn = get_history_connection()
    
    # Automatically delete history older than 1 week
    cursor = conn.cursor()
    cursor.execute("DELETE FROM execute_history WHERE created_at < NOW() - INTERVAL 7 DAY")
    conn.commit()
    cursor.close()

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
    SELECT * FROM execute_history
    ORDER BY created_at DESC
    """)
    history = cursor.fetchall()
    cursor.close()
    conn.close()
    return history


def delete_execute_history():
    conn = get_history_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM execute_history")
    conn.commit()
    cursor.close()
    conn.close()

def delete_single_execute_history(history_id):

    conn = get_history_connection()

    cursor = conn.cursor()

    query = "DELETE FROM execute_history WHERE id = %s"

    cursor.execute(query, (history_id,))

    conn.commit()

    cursor.close()

    conn.close()