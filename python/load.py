# load.py
import sys
import pandas as pd

# TODO: Migrate to Go for lightweight deployment

def load_dataset(data_file):
    try:
        data = pd.read_csv(data_file)
        print(f"Dataset '{data_file}' loaded successfully!")
        print(data.head())  # Display the first few rows as feedback
    except Exception as e:
        print(f"Error loading dataset '{data_file}': {e}")

if __name__ == "__main__":
    # Argument: data_file
    data_file = sys.argv[1]
    load_dataset(data_file)
