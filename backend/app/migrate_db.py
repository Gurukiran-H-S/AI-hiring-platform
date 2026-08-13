import sys
import os
import logging
from sqlalchemy import inspect, text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import user, resume, job, application, notification, interview, coding, evaluation, ml_models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_migrator")

def inspect_and_migrate():
    print("==================================================")
    print("DATABASE SCHEMA INSPECTION & MIGRATION TOOL")
    print("==================================================")
    print(f"Connecting to database engine: {engine.url}")

    Base.metadata.create_all(bind=engine)

    # 1. Alter file_type and parsed_phone column types in resumes table to VARCHAR(255)
    with engine.begin() as conn:
        try:
            conn.execute(text('ALTER TABLE resumes ALTER COLUMN file_type TYPE VARCHAR(255);'))
            conn.execute(text('ALTER TABLE resumes ALTER COLUMN parsed_phone TYPE VARCHAR(255);'))
            print("  [SUCCESS] Altered resumes.file_type and resumes.parsed_phone to VARCHAR(255)")
        except Exception as e:
            print(f"  [NOTE] Column type alteration note: {e}")

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"Existing tables in database: {existing_tables}")

    migrated_columns = []

    for table_name, table_obj in Base.metadata.tables.items():
        if table_name not in existing_tables:
            continue

        existing_cols = {col["name"]: col for col in inspector.get_columns(table_name)}
        model_cols = table_obj.columns

        for col_name, col_obj in model_cols.items():
            if col_name not in existing_cols:
                print(f"  [MISSING COLUMN] in DB: '{table_name}.{col_name}' (type: {col_obj.type})")
                col_type_str = str(col_obj.type)
                if "PortableUUID" in col_type_str or "UUID" in col_type_str:
                    ddl_type = "UUID" if "postgresql" in str(engine.url) else "VARCHAR(36)"
                elif "JSON" in col_type_str:
                    ddl_type = "JSON" if "postgresql" in str(engine.url) else "TEXT"
                elif "Float" in col_type_str:
                    ddl_type = "FLOAT"
                elif "Boolean" in col_type_str:
                    ddl_type = "BOOLEAN DEFAULT FALSE"
                elif "DateTime" in col_type_str:
                    ddl_type = "TIMESTAMP"
                elif "Text" in col_type_str:
                    ddl_type = "TEXT"
                elif "Integer" in col_type_str:
                    ddl_type = "INTEGER DEFAULT 0"
                else:
                    ddl_type = "VARCHAR(255)"

                if col_name == "ats_status":
                    ddl_type = "VARCHAR(50) DEFAULT 'PENDING'"

                sql = text(f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{col_name}" {ddl_type}')
                
                with engine.begin() as conn:
                    try:
                        conn.execute(sql)
                        print(f"  [ADDED COLUMN] '{table_name}.{col_name}' DDL: {ddl_type}")
                        migrated_columns.append(f"{table_name}.{col_name}")
                    except Exception as e:
                        print(f"  [ERROR] Could not add column '{table_name}.{col_name}': {e}")

    print("\n==================================================")
    print("MIGRATION SUMMARY COMPLETE!")
    print("==================================================")

if __name__ == "__main__":
    inspect_and_migrate()
