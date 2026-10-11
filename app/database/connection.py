import mysql.connector

def create_connection(host, port, user, password, database):

    print(host, port, user, database)

    conn = mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database
    )

    return conn