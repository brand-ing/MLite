# train.py
import sys
import pandas as pd
from sklearn.linear_model import LinearRegression

# TODO: Migrate to Go for lightweight deployment

def train_model(model_type, data_file, target_column):
    # Load the data
    data = pd.read_csv(data_file)
    X = data.drop(columns=[target_column])
    y = data[target_column]

    # Train the model
    if model_type == "linear_regression":
        model = LinearRegression()
        model.fit(X, y)
        print("Model trained successfully!")
        print("Coefficients:", model.coef_)
        print("Intercept:", model.intercept_)
    else:
        print(f"Model type '{model_type}' is not supported.")

if __name__ == "__main__":
    # Arguments: model_type, data_file, target_column
    model_type, data_file, target_column = sys.argv[1], sys.argv[2], sys.argv[3]
    train_model(model_type, data_file, target_column)
