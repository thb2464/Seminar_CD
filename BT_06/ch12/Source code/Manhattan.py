from flask import Flask, request, jsonify
import numpy as np
app = Flask(__name__)
@app.route("/distances", methods=["POST"])
def calculate_distance():
    data = request.get_json()
    dist_type = data.get("distance")
    a = np.asarray(data.get("df1"))
    b = np.asarray(data.get("df2"))
    if a.shape != b.shape:
        return jsonify({"error": "Matrices must have the same shape"})
    if dist_type == "L1":
        dist = np.sum(np.abs(a - b))
        return jsonify({"distance": dist})
    elif dist_type == "L2":
        dist = np.sqrt(np.sum((a - b) ** 2))
        return jsonify({"distance": dist})
    else:
        return jsonify({"error": "Invalid distance type"})

def get_manhattan_dist(a: np.ndarray, b: np.ndarray) -> float:
    """Return the Manhattan (L1) distance between two arrays."""
    return np.sum(np.abs(a - b))

def get_euclidean_dist(a: np.ndarray, b: np.ndarray) -> float:
    """Return the squared Euclidean (L2) distance between two arrays."""
    return np.sqrt(np.sum((a - b) ** 2))
