from database.history_connection import get_history_connection


def save_study_history(title, question, sql_query, explanation):

    conn = get_history_connection()

    cursor = conn.cursor()

    query = """
    INSERT INTO study_history
    (title, question, sql_query, explanation)
    VALUES (%s, %s, %s, %s)
    """

    values = (
        title,
        question,
        sql_query,
        explanation
    )

    cursor.execute(query, values)

    conn.commit()

    cursor.close()

    conn.close()

def get_study_history():
    conn = get_history_connection()
    
    # Automatically delete history older than 1 week
    cursor = conn.cursor()
    cursor.execute("DELETE FROM study_history WHERE created_at < NOW() - INTERVAL 7 DAY")
    conn.commit()
    cursor.close()

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
    SELECT * FROM study_history
    ORDER BY created_at DESC
    """)
    history = cursor.fetchall()
    cursor.close()
    conn.close()

    return history


def delete_study_history():
    conn = get_history_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM study_history")
    conn.commit()
    cursor.close()
    conn.close()

def delete_single_study_history(history_id):

    conn = get_history_connection()

    cursor = conn.cursor()

    query = "DELETE FROM study_history WHERE id = %s"

    cursor.execute(query, (history_id,))
    conn.commit()

    cursor.close()

    conn.close()