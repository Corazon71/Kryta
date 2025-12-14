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

# 4. Dependency for FastAPI
# This allows you to use: def endpoint(session: Session = Depends(get_session))
def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session