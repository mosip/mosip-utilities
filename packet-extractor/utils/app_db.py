import psycopg2
from psycopg2.extras import RealDictCursor

class DatabaseSession: 
    def __init__(self, user, pwd, host, port, db_name):
        self.conn = psycopg2.connect(user = user, password = pwd, host = host, port = port, database = db_name) 
    
    def close(self):
        self.conn.close()

    def fetch_all(self, query, params=None):
        cur = self.conn.cursor(cursor_factory=RealDictCursor)
        if (params is None):
            cur.execute(query)
        else:
            cur.execute(query, params)
        resp = cur.fetchall()   
        cur.close()
        return resp

    def fetch_one(self, query, params=None):
        cur = self.conn.cursor(cursor_factory=RealDictCursor)
        if (params is None):
            cur.execute(query)
        else:
            cur.execute(query, params)
        resp = cur.fetchone()   
        cur.close()
        return resp        