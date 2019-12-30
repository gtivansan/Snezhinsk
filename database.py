import sqlite3

class Connection:
    def __enter__(self):
        self.connect = sqlite3.connect('database.db')
        cursor = self.connect.cursor
        return cursor

    def __exit__(self, type, value, traceback):
        self.connect.commit()

def init_db():
    with Connection() as cursor:
        cursor().execute('''
            CREATE TABLE IF NOT EXISTS snowflakes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signature TEXT,
            snowflake TEXT
            )''')

def drop_db():
    init_db()
    with Connection() as cursor:
        cursor().execute("DROP TABLE snowflakes")

class Snowflake:
    def __init__(self, id, signature, snowflake):
        self.id = id
        self.signature = signature
        self.snowflake = snowflake

    def __str__(self):
        return f"Snowflake\nid: {self.id};\nsignature: {self.signature};\nsnowflake: {self.snowflake}"

    def __repr__(self):
        return str(self)

class Database:
    def __init__(self):
        init_db()

    def addSnowflake(self, signature, snowflake):
        with Connection() as cursor:
            cursor().execute('''
                INSERT INTO snowflakes (signature, snowflake)
                VALUES (?, ?)''', [signature, snowflake]
            )

    def getSnowflake(self, id):
        with Connection() as cursor:
            data = cursor().execute('''SELECT * FROM snowflakes WHERE id=?''', [id]).fetchone()
            print(data)
            if data is None:
                return None
            else:
                return Snowflake(*data)

    def getSnowflakesCount(self):
        with Connection() as cursor:
            data = cursor().execute('''SELECT COUNT (*) FROM snowflakes''').fetchone()
            return data[0]
