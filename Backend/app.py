from flask import Flask, request, jsonify
from flask_cors import CORS
from cvzone.ClassificationModule import Classifier
import cv2
import numpy as np
from PIL import Image
import io
import math

app = Flask(__name__)
CORS(app)

# -----------------------------
# LOAD MODEL
# -----------------------------
classifier = Classifier(
    "Model/keras_model.h5",
    "Model/labels.txt"
)

# -----------------------------
# LABELS
# -----------------------------
labels = [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "Nine",
    "a",
    "B",
    "C",
    "d",
    "Time",
    "Hello"
]

print("✅ Model Loaded")
print("✅ Labels Loaded")

# -----------------------------
# SETTINGS
# -----------------------------
imgSize = 300
offset = 20

# -----------------------------
# PREDICT API
# -----------------------------
@app.route("/predict", methods=["POST"])
def predict():

    try:

        # Check image
        if "image" not in request.files:

            return jsonify({
                "error": "No image uploaded"
            })

        file = request.files["image"]

        # Read image bytes
        image_bytes = file.read()

        # Convert bytes to numpy array
        npimg = np.frombuffer(
            image_bytes,
            np.uint8
        )

        # Decode image
        img = cv2.imdecode(
            npimg,
            cv2.IMREAD_COLOR
        )

        if img is None:

            return jsonify({
                "error": "Invalid image"
            })

        # -----------------------------------
        # CREATE WHITE BACKGROUND
        # -----------------------------------
        imgWhite = np.ones(
            (imgSize, imgSize, 3),
            np.uint8
        ) * 255

        h, w, _ = img.shape

        aspectRatio = h / w

        # -----------------------------------
        # RESIZE LIKE TRAINING
        # -----------------------------------
        if aspectRatio > 1:

            k = imgSize / h

            wCal = math.ceil(k * w)

            imgResize = cv2.resize(
                img,
                (wCal, imgSize)
            )

            wGap = math.ceil(
                (imgSize - wCal) / 2
            )

            imgWhite[
                :,
                wGap:wCal + wGap
            ] = imgResize

        else:

            k = imgSize / w

            hCal = math.ceil(k * h)

            imgResize = cv2.resize(
                img,
                (imgSize, hCal)
            )

            hGap = math.ceil(
                (imgSize - hCal) / 2
            )

            imgWhite[
                hGap:hCal + hGap,
                :
            ] = imgResize

        # -----------------------------------
        # PREDICTION
        # -----------------------------------
        prediction, index = classifier.getPrediction(
            imgWhite,
            draw=False
        )

        confidence = float(
            max(prediction)
        )

        predicted_label = labels[index]

        print("Prediction:", predicted_label)
        print("Confidence:", confidence)

        # -----------------------------------
        # RESPONSE
        # -----------------------------------
        return jsonify({

            "prediction": predicted_label,

            "confidence": round(
                confidence * 100,
                2
            )
        })

    except Exception as e:

        print("ERROR:", str(e))

        return jsonify({
            "error": str(e)
        })

# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )