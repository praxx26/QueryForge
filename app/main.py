import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.request_model import (
    QueryRequest, ERDRequest,
    TableListRequest, TableDataRequest, TableInsertRequest,
    TableUpdateRequest, TableDeleteRequest
)
from models.study_model import StudyQueryRequest
from database.connection import create_connection
from database.schemareader import get_schema, get_detailed_schema_erd, get_table_study_context
from database.table_manager import (
    get_database_tables_summary,
    get_table_data,
    insert_table_row,
    update_table_row,
    delete_table_row
)
from database.executer import execute_query, execute_explain
from database.guardrails import check_sql_safety, mask_sensitive_dataset
from ai.ai_engine import (
    generate_sql,
    generate_study_sql,
    answer_table_study,
    answer_concept_study,
    analyze_insights,
    analyze_performance_advisor,
    get_groq_api_keys
)
from ai.explain_sql import explain_sql
from ai.history_title import generate_history_title

from history.study_history import (
    save_study_history,
    get_study_history,
    delete_study_history,
    delete_single_study_history
)

from history.execute_history import (
    save_execute_history,
    get_execute_history,
    delete_execute_history,
    delete_single_execute_history
)

app = FastAPI(title="AI SQL Assistant Pro", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/system-status")
def system_status():
    keys = get_groq_api_keys()
    return {
        "status": "online",
        "active_api_keys_count": len(keys),
        "features": [
            "Multi-Key Groq Fallback Pool",
            "Auto Data Visualization & Business Insights",
            "AI Performance Advisor & EXPLAIN Analyzer",
            "Security Guardrails & PII Data Masking",
            "Visual Schema & ERD Explorer",
            "Conversational Follow-Up Memory"
        ]
    }

@app.post("/schema-erd")
def get_schema_erd_api(request: ERDRequest):
    try:
        conn = create_connection(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password.get_secret_value(),
            database=request.database
        )
        erd_data = get_detailed_schema_erd(conn)
        conn.close()
        return {"success": True, "erd": erd_data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/tables/list")
def list_connected_tables_api(request: TableListRequest):
    try:
        conn = create_connection(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password.get_secret_value(),
            database=request.database
        )
        tables = get_database_tables_summary(conn)
        conn.close()
        return {"success": True, "tables": tables, "database": request.database}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/tables/rows")
def get_table_rows_api(request: TableDataRequest):
    try:
        conn = create_connection(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password.get_secret_value(),
            database=request.database
        )
        data = get_table_data(
            conn=conn,
            table_name=request.table_name,
            page=request.page or 1,
            page_size=request.page_size or 25,
            search_term=request.search
        )
        conn.close()
        return {"success": True, **data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/tables/insert-row")
def insert_table_row_api(request: TableInsertRequest):
    try:
        conn = create_connection(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password.get_secret_value(),
            database=request.database
        )
        res = insert_table_row(conn, request.table_name, request.data)
        conn.close()
        return res
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/tables/update-row")
def update_table_row_api(request: TableUpdateRequest):
    try:
        conn = create_connection(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password.get_secret_value(),
            database=request.database
        )
        res = update_table_row(
            conn,
            request.table_name,
            request.primary_key,
            request.primary_value,
            request.data
        )
        conn.close()
        return res
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/tables/delete-row")
def delete_table_row_api(request: TableDeleteRequest):
    try:
        conn = create_connection(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password.get_secret_value(),
            database=request.database
        )
        res = delete_table_row(
            conn,
            request.table_name,
            request.primary_key,
            request.primary_value
        )
        conn.close()
        return res
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/generate-and-execute")
def generate_query(request: QueryRequest):
    try:
        conn = create_connection(
            host=request.host,
            port=request.port,
            user=request.user,
            password=request.password.get_secret_value(),
            database=request.database
        )

        schema = get_schema(conn)

        # 1. AI SQL Generation with conversation context & multi-key fallback
        sql_query, model_used, key_used = generate_sql(
            schema=schema,
            question=request.question,
            conversation_history=request.conversation_history
        )

        # 2. Strict Security Guardrail verification
        is_safe, violation_msg = check_sql_safety(sql_query)
        if not is_safe:
            conn.close()
            return {
                "error": violation_msg,
                "blocked_query": sql_query,
                "security_alert": True
            }

        # 3. Execution & Timing
        start_time = time.time()
        raw_results = execute_query(conn, sql_query)
        end_time = time.time()
        execution_time = round(end_time - start_time, 4)

        # 4. Performance Advisor (EXPLAIN Plan)
        explain_plan = execute_explain(conn, sql_query)
        advisor = analyze_performance_advisor(sql_query, explain_plan)

        # 5. PII Masking
        masked_results, pii_count = mask_sensitive_dataset(
            raw_results,
            enabled=request.mask_pii if request.mask_pii is not None else True
        )

        # 6. SQL Explanation
        explanation = explain_sql(sql_query, "database")

        # 7. AI Visual Insights & Chart Recommendations
        insights = analyze_insights(request.question, sql_query, masked_results)

        clean_sql = " ".join(sql_query.split())
        title = generate_history_title(request.question)
        
        # Save to execute history
        save_execute_history(
            title,
            request.database,
            request.question,
            clean_sql,
            explanation,
            masked_results
        )

        conn.close()

        return {
            "question": request.question,
            "sql_query": clean_sql,
            "explanation": explanation,
            "results": masked_results,
            "rows_returned": len(masked_results),
            "execution_time_seconds": execution_time,
            "insights": insights,
            "performance_advisor": advisor,
            "explain_plan": explain_plan,
            "pii_masked_count": pii_count,
            "model_used": model_used,
            "key_used": key_used
        }

    except Exception as e:
        return {
            "error": str(e)
        }

@app.post("/study-sql")
def study_sql(request: StudyQueryRequest):
    try:
        study_type = request.study_type or "table"

        if study_type == "table":
            # 1. Connected Database Table & Schema Study Mode
            conn = create_connection(
                host=request.host or "127.0.0.1",
                port=request.port or 3306,
                user=request.user or "root",
                password=request.password.get_secret_value() if request.password else "Praga08@@",
                database=request.database or "company"
            )
            table_context = get_table_study_context(conn)
            conn.close()

            answer, model_used, key_used = answer_table_study(
                table_context=table_context,
                question=request.question,
                conversation_history=request.conversation_history
            )
        else:
            # 2. General Concept Study Mode (No database connection needed)
            answer, model_used, key_used = answer_concept_study(
                question=request.question,
                conversation_history=request.conversation_history
            )

        title = generate_history_title(request.question)

        save_study_history(
            title=title,
            question=request.question,
            sql_query="",
            explanation=answer
        )

        return {
            "question": request.question,
            "answer": answer,
            "explanation": answer,
            "study_type": study_type,
            "model_used": model_used,
            "key_used": key_used
        }

    except Exception as e:
        return {
            "error": str(e)
        }

@app.get("/study-history")
def study_history_api():
    history = get_study_history()
    return {
        "total": len(history),
        "history": history
    }

@app.get("/execute-history")
def execute_history_api():
    history = get_execute_history()
    return {
        "total": len(history),
        "history": history
    }

@app.delete("/delete-study-history")
def delete_study_history_api():
    delete_study_history()
    return {
        "message": "Study history deleted successfully"
    }

@app.delete("/delete-execute-history")
def delete_execute_history_api():
    delete_execute_history()
    return {
        "message": "Execute history deleted successfully"
    }

@app.delete("/delete-single-study-history/{history_id}")
def delete_single_study_history_api(history_id: int):
    delete_single_study_history(history_id)
    return {
        "message": "Study history deleted successfully"
    }

@app.delete("/delete-single-execute-history/{history_id}")
def delete_single_execute_history_api(history_id: int):
    delete_single_execute_history(history_id)
    return {
        "message": "Execute history deleted successfully"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
