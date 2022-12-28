import psycopg2
from psycopg2.extras import RealDictCursor
# import pandas as pd
# from sqlalchemy import create_engine
from urllib.parse import quote_plus as urlquote
from contextlib import contextmanager
import config as conf

def get_connection(db_name):
    user=conf.db_user
    pwd=conf.db_pass
    host=conf.db_host 
    port=conf.db_port
    db_name=db_name
    conn = psycopg2.connect(user = user, password = pwd, host = host, port = port, database = db_name) 
    return conn

# @contextmanager
# def get_connection1(db_name):
#     user=conf.db_user
#     pwd=urlquote(conf.db_pass)
#     host=conf.db_host 
#     port=conf.db_port
#     db_name=db_name
#     url = "postgresql+psycopg2://{}:{}@{}:{}/{}".format(user, pwd, host, port, db_name)
#     print(url)
#     conn = create_engine(url).connect()
#     try:
#         yield conn
#     except Exception as ex:
#         raise Exception(f"while getting db connection info... {ex}")

# def fetch_data(db_name, query, params=None):
#     with get_connection(db_name) as conn:
#         return pd.read_sql(query, conn, params)

def fetch_all(db_name, query, params=None):
    conn = get_connection(db_name)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            resp = cur.fetchall()
            return resp
    except Exception as ex:
        raise Exception(f"while fetching result set info... {ex}")
    finally:
        conn.close()

def get_time_dict(from_date, to_date):
    try:
        query = f"""
            select to_char(generate_series('{from_date}'::timestamp, '{to_date}', '2 hours'),'HH24:MI:SS') as time_list
                """
        time_list = fetch_all("mosip_regprc", query)
        ordered_time_list = order_time_list(time_list)
        return ordered_time_list
    except Exception as ex:
        raise Exception(f"while fetching get_time_dict info... {ex}")

def order_time_list(time_list):
    time_dict = {}
    pos = 1
    for time in time_list:
        time_dict[time["time_list"]] = pos
        pos = pos + 1
    return time_dict