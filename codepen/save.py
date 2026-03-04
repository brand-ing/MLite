# save.py
import sys

# TODO: Migrate to Go for lightweight deployment

def save_results(output_file, message="Dummy data saved successfully."):
    try:
        with open(output_file, "w") as f:
            f.write(message)
        print(f"File '{output_file}' saved successfully!")
    except Exception as e:
        print(f"Error saving file '{output_file}': {e}")

if __name__ == "__main__":
    # Argument: output_file
    output_file = sys.argv[1]
    save_results(output_file)
