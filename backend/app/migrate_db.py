import sys
import os
import logging
from sqlalchemy import inspect, text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
# Import all models to ensure metadata is populated
from app.models import user, resume, job, application, notification, interview, coding, evaluation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_migrator")

def inspect_and_migrate():
    print("==================================================")
    print("DATABASE SCHEMA INSPECTION & MIGRATION TOOL")
    print("==================================================")
    print(f"Connecting to database engine: {engine.url}")

    # First run create_all for any missing tables
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"Existing tables in database: {existing_tables}")

    migrated_columns = []

    # Iterate over all registered SQLAlchemy model tables
    for table_name, table_obj in Base.metadata.tables.items():
        if table_name not in existing_tables:
            print(f"Table '{table_name}' was missing and created by create_all.")
            continue

        existing_cols = {col["name"]: col for col in inspector.get_columns(table_name)}
        model_cols = table_obj.columns

        print(f"\nChecking table '{table_name}': {len(existing_cols)} DB columns vs {len(model_cols)} Model columns")

        for col_name, col_obj in model_cols.items():
            if col_name not in existing_cols:
                print(f"  [MISSING COLUMN] in DB: '{table_name}.{col_name}' (type: {col_obj.type})")
                
                # Determine DDL column type
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

                # Construct DDL statement
                sql = text(f'ALTER TABLE "{table_name}" ADD COLUMN IF NOT EXISTS "{col_name}" {ddl_type}')
                
                with engine.begin() as conn:
                    try:
                        conn.execute(sql)
                        print(f"  [ADDED COLUMN] '{table_name}.{col_name}' DDL: {ddl_type}")
                        migrated_columns.append(f"{table_name}.{col_name}")
                    except Exception as e:
                        print(f"  [ERROR] Could not add column '{table_name}.{col_name}': {e}")

    print("\n==================================================")
    print("MIGRATION SUMMARY:")
    if migrated_columns:
        print(f"Added {len(migrated_columns)} missing columns: {migrated_columns}")
    else:
        print("All database tables are 100% synchronized with SQLAlchemy models! Zero column mismatches.")
    print("==================================================")

if __name__ == "__main__":
    inspect_and_migrate()
