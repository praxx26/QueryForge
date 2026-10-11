import os
from dotenv import load_dotenv
from ai.ai_engine import execute_chat_completion_with_fallback

load_dotenv()

def explain_sql(sql_query, mode="database"):
    if mode == "study":
        prompt = f"""
        You are an expert SQL teacher.
        Explain the following SQL query in a detailed beginner-friendly way.

        SQL Query:
        {sql_query}

        Rules:
        - Explain ONLY the SQL clauses present in the query
        - Explain the query line by line with numbered points
        - Explain what it does, why it is used, and what output it affects
        - Keep explanation practical, clean, and concise
        - Add a short final summary of what the query does
        - Do not generate SQL
        - Do not use markdown backticks
        """
    else:
        prompt = f"""
        You are an SQL expert.
        Explain the following SQL query concisely in 3 to 5 bullet points.

        SQL Query:
        {sql_query}

        Rules:
        - Concise and beginner friendly
        - Focus only on what the query filters, aggregates, or retrieves
        - Do not generate SQL
        """

    try:
        content, _, _ = execute_chat_completion_with_fallback(
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=600
        )
        return content
    except Exception as e:
        return f"Query summary: Retrieves data according to the provided SQL criteria. ({str(e)})"