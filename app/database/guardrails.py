import re

# Sensitive data regex patterns
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')
PHONE_PATTERN = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')
CREDIT_CARD_PATTERN = re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b')
SSN_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')

DANGEROUS_COMMANDS = [
    r'\bDROP\b',
    r'\bDELETE\b',
    r'\bTRUNCATE\b',
    r'\bALTER\b',
    r'\bGRANT\b',
    r'\bREVOKE\b',
    r'\bSHUTDOWN\b',
    r'\bEXEC\b',
    r'\bEXECUTE\b'
]

def check_sql_safety(sql_query: str):
    """
    Validates that the SQL query is safe and non-destructive.
    Returns (is_safe: bool, violation_message: str or None)
    """
    clean_sql = sql_query.strip().upper()

    for pattern in DANGEROUS_COMMANDS:
        if re.search(pattern, clean_sql, re.IGNORECASE):
            command = pattern.replace(r'\b', '')
            return False, f"Prohibited keyword detected: {command}. Only read and safe analytical queries are permitted."

    # Prevent multiple chained queries like `SELECT 1; DROP TABLE users;`
    queries = [q.strip() for q in sql_query.split(';') if q.strip()]
    if len(queries) > 1:
        return False, "Multi-statement query execution is disabled for database protection."

    return True, None

def mask_pii_value(val):
    if not isinstance(val, str):
        return val

    # Mask email: j***e@domain.com
    def mask_email(match):
        email = match.group(0)
        parts = email.split('@')
        if len(parts) == 2 and len(parts[0]) > 2:
            return f"{parts[0][0]}***{parts[0][-1]}@{parts[1]}"
        return "***@***.com"

    # Mask phone / credit card
    masked = EMAIL_PATTERN.sub(mask_email, val)
    masked = CREDIT_CARD_PATTERN.sub("****-****-****-####", masked)
    masked = PHONE_PATTERN.sub("###-###-####", masked)
    masked = SSN_PATTERN.sub("***-**-####", masked)
    return masked

def mask_sensitive_dataset(rows, enabled=True):
    """
    Scans row dictionary dataset and masks PII/sensitive fields.
    """
    if not enabled or not rows:
        return rows, 0

    masked_rows = []
    masked_count = 0

    for row in rows:
        new_row = {}
        for k, v in row.items():
            if isinstance(v, str):
                new_v = mask_pii_value(v)
                if new_v != v:
                    masked_count += 1
                new_row[k] = new_v
            else:
                new_row[k] = v
        masked_rows.append(new_row)

    return masked_rows, masked_count
