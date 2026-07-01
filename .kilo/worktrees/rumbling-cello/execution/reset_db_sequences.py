import psycopg2
import os
from dotenv import load_dotenv

def reset_sequences():
    # Load env from backend directory
    env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
    load_dotenv(env_path)

    conn = None
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'bebang_db'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', '123456789')
        )
        cur = conn.cursor()

        # Query to find all sequences and their associated tables/columns
        # This works for PostgreSQL
        query = """
        SELECT 
            t.relname AS table_name,
            c.attname AS column_name,
            s.relname AS sequence_name
        FROM pg_class s
        JOIN pg_depend d ON d.objid = s.oid
        JOIN pg_class t ON d.refobjid = t.oid
        JOIN pg_attribute c ON (d.refobjid = c.attrelid AND d.refobjsubid = c.attnum)
        WHERE s.relkind = 'S' 
        AND d.deptype = 'a'
        AND t.relkind = 'r';
        """
        
        cur.execute(query)
        sequences = cur.fetchall()

        if not sequences:
            print("No sequences found to reset.")
            return

        print(f"Found {len(sequences)} sequences. Resetting...")

        for table, column, seq in sequences:
            # Construct the reset SQL
            # setval(seq, COALESCE(MAX(id), 1), MAX(id) IS NOT NULL)
            # This resets the sequence to the current MAX value. 
            # If table is empty, next val will be 1.
            reset_sql = f"""
            SELECT setval('{seq}', COALESCE(MAX({column}), 0) + 1, false)
            FROM {table};
            """
            cur.execute(reset_sql)
            print(f"  - Reset {seq} for {table}.{column}")

        conn.commit()
        print("Successfully reset all sequences.")

    except Exception as e:
        print(f"Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    reset_sequences()
