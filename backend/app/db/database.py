from sqlmodel import SQLModel, create_engine, Session
from typing import Generator

# 1. Define the database file path (creates 'todo.db' in the root folder)
sqlite_file_name = "todo.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# 2. Create the engine
# connect_args={"check_same_thread": False} is CRITICAL for SQLite + FastAPI 
# because FastAPI runs in multiple threads, but SQLite usually prefers one.
engine = create_engine(
    sqlite_url, 
    echo=False, # Set to True if you want to see SQL queries in the console
    connect_args={"check_same_thread": False} 
)

# 3. Initialization function (Creates tables based on your models)
def init_db():
    # This looks at all imported SQLModel classes and creates tables
    SQLModel.metadata.create_all(engine)

    with engine.begin() as conn:
        try:
            cols = conn.exec_driver_sql("PRAGMA table_info('task')").fetchall()
            existing = {row[1] for row in cols}

            if "group_id" not in existing:
                conn.exec_driver_sql("ALTER TABLE task ADD COLUMN group_id TEXT")
            if "group_title" not in existing:
                conn.exec_driver_sql("ALTER TABLE task ADD COLUMN group_title TEXT")
            if "step_order" not in existing:
                conn.exec_driver_sql("ALTER TABLE task ADD COLUMN step_order INTEGER")
                conn.exec_driver_sql("UPDATE task SET step_order = 1 WHERE step_order IS NULL")
        except Exception:
            pass

# 4. Dependency for FastAPI
# This allows you to use: def endpoint(session: Session = Depends(get_session))
def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session