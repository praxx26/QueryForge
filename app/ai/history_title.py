import os
from dotenv import load_dotenv
from ai.ai_engine import execute_chat_completion_with_fallback

load_dotenv()

def generate_history_title(question):
    prompt = f"""
    Convert the following user request into a short professional title.

    User Request:
    {question}

    Rules:
    - Maximum 5 words
    - Professional
    - Clear
    - No punctuation
    - Return only title
    """

    try:
        content, _, _ = execute_chat_completion_with_fallback(
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=20
        )
        return content.replace('"', '').strip()
    except Exception:
        # Fallback to simple slice if LLM fails
        return " ".join(question.split()[:4]).capitalize()