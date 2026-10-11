import os
import re
from dotenv import load_dotenv
from openai import OpenAI
import sqlparse

load_dotenv()

# Collect up to 6 Groq API keys from environment
def get_groq_api_keys():
    keys = []
    # Primary key
    primary = os.getenv("GROQ_API_KEY")
    if primary and primary.strip():
        keys.append(primary.strip())
    
    # Check GROQ_API_KEY_1 through GROQ_API_KEY_6
    for i in range(1, 7):
        k = os.getenv(f"GROQ_API_KEY_{i}")
        if k and k.strip() and k.strip() not in keys:
            keys.append(k.strip())
            
    # Also support comma-separated GROQ_API_KEYS
    csv_keys = os.getenv("GROQ_API_KEYS")
    if csv_keys:
        for k in csv_keys.split(","):
            clean_k = k.strip()
            if clean_k and clean_k not in keys:
                keys.append(clean_k)
                
    return keys if keys else ["gsk_placeholder"]

# Candidate models in order of priority (tested and active on Groq)
CANDIDATE_MODELS = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "allam-2-7b"
]

def execute_chat_completion_with_fallback(messages, temperature=0, max_tokens=1500):
    """
    Executes chat completion with automatic fallback across multiple Groq API keys
    and multiple backup LLM models if rate-limited or error occurs.
    """
    api_keys = get_groq_api_keys()
    last_error = None

    for key_index, api_key in enumerate(api_keys):
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        for model in CANDIDATE_MODELS:
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                return response.choices[0].message.content.strip(), model, f"Key-{key_index+1}"
            except Exception as e:
                err_str = str(e).lower()
                last_error = e
                # If rate limited (429) or quota exceeded, try next model or next key
                if "429" in err_str or "rate limit" in err_str or "quota" in err_str:
                    continue # Try next model or next key
                elif "decommissioned" in err_str or "model_not_found" in err_str:
                    continue # Try next supported model
                else:
                    # Switch to next key
                    break

    # If all keys/models failed, raise the last encountered error
    raise Exception(f"All Groq API fallback keys and models failed. Last error: {str(last_error)}")

def generate_sql(schema, question, conversation_history=None):
    history_context = ""
    if conversation_history and len(conversation_history) > 0:
        history_context = "\nConversation Context (Previous queries & requests):\n"
        for item in conversation_history[-3:]:
            history_context += f"- User: {item.get('question', '')}\n  SQL: {item.get('sql_query', '')}\n"

    prompt = f"""
    You are an expert SQL generator and DBA.

    Use ONLY the tables and columns provided.

    Database Schema:
    {schema}
    {history_context}
    User Request:
    {question}

    Rules:
    - Generate ONLY valid MySQL compatible SQL
    - Use LIMIT instead of TOP
    - Do not use SQL Server or PostgreSQL specific syntax
    - No explanations, no markdown, no quotes around SQL
    - Use ONLY provided tables and columns. Do not hallucinate columns.
    - If user asks a follow-up or refinement, refer to Conversation Context.
    - Output MUST be pure executable SQL query only.
    """

    content, model_used, key_used = execute_chat_completion_with_fallback(
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    sql_query = content.replace("```sql", "").replace("```", "").strip()
    formatted_sql = sqlparse.format(
        sql_query,
        reindent=True,
        keyword_case='upper'
    )
    return formatted_sql, model_used, key_used

def answer_table_study(table_context, question, conversation_history=None):
    """
    Expert DBA and Table Tutor that directly answers questions regarding
    the connected database table(s), row counts, schema design, and optimizations
    without forcing a rigid code-editor output.
    """
    history_context = ""
    if conversation_history and len(conversation_history) > 0:
        history_context = "\nConversation Context:\n"
        for item in conversation_history[-3:]:
            history_context += f"- User: {item.get('question', '')}\n  Assistant: {item.get('answer', '')[:200]}...\n"

    prompt = f"""
    You are a Lead Database Architect and Senior DBA Advisor for an enterprise SQL analytics platform.
    
    Connected Live MySQL Environment Details:
    {table_context}
    {history_context}
    
    User Inquiry:
    {question}

    Professional Response Guidelines:
    1. Tone: Authoritative, polished, executive, and direct. Avoid conversational filler, apologies, or robotic redundancy.
    2. Data Counts & Record Inquiries (e.g. row counts, table volume):
       - State the exact record volume clearly in an Executive Summary (e.g. "The `employees` table currently contains **11 records**.").
       - Provide a concise summary of the primary key, column architecture, and current index coverage.
    3. Performance & Optimization Inquiries (e.g. how to optimize, indexing tips):
       - Deliver a structured DBA Optimization Assessment.
       - Provide actionable index strategies (e.g., creating secondary indexes for sorting/filtering on specific columns) with concrete `CREATE INDEX` statements.
       - Highlight query execution benefits (avoiding full-table scans, reducing filesorts).
    4. Schema & Architectural Inquiries:
       - Summarize column data types, constraints, and relational integrity clearly.
    5. Formatting:
       - Format with clean Markdown headers (`###`), bold highlights, and clean bullet lists.
       - Never duplicate sentences or produce raw syntax errors.
    """

    content, model_used, key_used = execute_chat_completion_with_fallback(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1000
    )
    return content.strip(), model_used, key_used

def answer_concept_study(question, conversation_history=None):
    """
    General SQL Education Tutor that explains SQL concepts, theory,
    syntax, and interview topics without requiring any database connection.
    """
    history_context = ""
    if conversation_history and len(conversation_history) > 0:
        history_context = "\nPrevious Discussion:\n"
        for item in conversation_history[-3:]:
            history_context += f"- User: {item.get('question', '')}\n"

    prompt = f"""
    You are a Master SQL Educator and Database Tutor.
    {history_context}
    User SQL Concept Question:
    {question}

    Instructions:
    Explain this SQL concept in a clear, beginner-to-advanced friendly manner.
    Structure your answer with:
    1. 💡 **Concept Overview & What It Does**: Intuitive definition.
    2. 🎯 **Why & When to Use It**: Real-world use cases.
    3. 💻 **Syntax & Illustrative Example**: Clean, commented SQL snippet demonstrating usage.
    4. ⚠️ **Common Mistakes & Pro Tips**: What beginners get wrong or performance advice.
    5. 📌 **Quick Takeaway**: 1-2 sentence recap.

    Format in clean, engaging Markdown.
    """

    content, model_used, key_used = execute_chat_completion_with_fallback(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1200
    )
    return content.strip(), model_used, key_used

def generate_study_sql(question, conversation_history=None):
    # Kept for backward compatibility
    return answer_concept_study(question, conversation_history)

def analyze_insights(question, sql_query, sample_data):
    """
    Generates intelligent business insights and recommends visualization types.
    """
    prompt = f"""
    You are a Senior Data Analyst and BI Expert.
    Analyze the following SQL query and sample result data to provide executive insights.

    User Question: {question}
    SQL Query: {sql_query}
    Sample Data (First few rows): {sample_data[:5]}

    Provide your response in JSON format with exactly these keys:
    {{
        "key_takeaways": ["point 1", "point 2", "point 3"],
        "recommended_chart": "bar" | "line" | "pie" | "metric" | "table",
        "chart_title": "Descriptive chart title",
        "x_axis_key": "Suggested column name for X axis or category",
        "y_axis_key": "Suggested column name for Y axis or value metric"
    }}
    Return ONLY valid JSON. No markdown ticks.
    """

    try:
        content, _, _ = execute_chat_completion_with_fallback(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=600
        )
        content = content.replace("```json", "").replace("```", "").strip()
        import json
        return json.loads(content)
    except Exception:
        return {
            "key_takeaways": ["Data retrieved successfully."],
            "recommended_chart": "table",
            "chart_title": "Query Results",
            "x_axis_key": "",
            "y_axis_key": ""
        }

def analyze_performance_advisor(sql_query, explain_results):
    """
    Analyzes MySQL EXPLAIN output to provide DBA optimization tips.
    """
    prompt = f"""
    You are an expert MySQL Database Administrator (DBA).
    Analyze this query and MySQL EXPLAIN execution plan.

    Query: {sql_query}
    EXPLAIN Output: {explain_results}

    Provide advice in JSON format with:
    {{
        "performance_rating": "OPTIMAL" | "MODERATE" | "NEEDS_OPTIMIZATION",
        "has_full_table_scan": true | false,
        "recommendations": ["Recommendation 1", "Recommendation 2"],
        "suggested_indexes": ["CREATE INDEX idx_name ON table(column)"]
    }}
    Return ONLY valid JSON. No markdown formatting.
    """
    try:
        content, _, _ = execute_chat_completion_with_fallback(
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=600
        )
        content = content.replace("```json", "").replace("```", "").strip()
        import json
        return json.loads(content)
    except Exception:
        return {
            "performance_rating": "OPTIMAL",
            "has_full_table_scan": False,
            "recommendations": ["Query execution analyzed."],
            "suggested_indexes": []
        }