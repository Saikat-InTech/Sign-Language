from flask import Flask, jsonify, request
from flask_cors import CORS

import io
from pathlib import Path
from threading import Lock

import numpy as np
import tensorflow as tf
from PIL import Image, ImageOps

app = Flask(__name__)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
predict_lock = Lock()


def resolve_existing_path(*candidates):
    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        "Could not find required file. Tried: "
        + ", ".join(str(candidate) for candidate in candidates)
    )


MODEL_PATH = resolve_existing_path(
    # BASE_DIR / "keras_model.h5",
    BASE_DIR / "Model" / "keras_model.h5",
)
LABELS_PATH = resolve_existing_path(
    # BASE_DIR / "labels.txt",
    BASE_DIR / "Model" / "labels.txt",
)


def build_teachable_machine_model():
    feature_extractor = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(224, 224, 3), name="model1_input"),
            tf.keras.applications.MobileNetV2(
                input_shape=(224, 224, 3),
                alpha=0.35,
                include_top=False,
                weights=None,
                pooling=None,
            ),
            tf.keras.layers.GlobalAveragePooling2D(
                name="global_average_pooling2d_GlobalAveragePooling2D1"
            ),
        ],
        name="sequential_1",
    )

    classifier = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(1280,), name="dense_Dense1_input"),
            tf.keras.layers.Dense(100, activation="relu", name="dense_Dense1"),
            tf.keras.layers.Dense(
                15,
                activation="softmax",
                use_bias=False,
                name="dense_Dense2",
            ),
        ],
        name="sequential_3",
    )

    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(224, 224, 3), name="sequential_1_input"),
            feature_extractor,
            classifier,
        ]
    )
    model.load_weights(MODEL_PATH)
    return model


def load_labels():
    with LABELS_PATH.open("r", encoding="utf-8") as file:
        return [line.split(" ", 1)[1].strip() for line in file.readlines() if line.strip()]


model = build_teachable_machine_model()
labels = load_labels()
MODEL_INPUT_HEIGHT = int(model.input_shape[1])
MODEL_INPUT_WIDTH = int(model.input_shape[2])

if len(labels) != model.output_shape[-1]:
    raise ValueError(
        f"Label count ({len(labels)}) does not match model output classes ({model.output_shape[-1]})."
    )


def preprocess(image):
    fitted_image = ImageOps.fit(
        image.convert("RGB"),
        (MODEL_INPUT_WIDTH, MODEL_INPUT_HEIGHT),
        Image.Resampling.LANCZOS,
    )
    image_array = np.asarray(fitted_image).astype("float32")
    normalized_image = (image_array / 127.5) - 1.0
    return np.expand_dims(normalized_image, axis=0)


def predict_scores(image):
    processed = preprocess(image)
    with predict_lock:
        return model.predict(processed, verbose=0)


def build_top_predictions(prediction, limit=3):
    scores = prediction[0]
    top_indices = np.argsort(scores)[::-1][:limit]

    return [
        {
            "label": labels[int(index)],
            "confidence": round(float(scores[index]) * 100, 2),
        }
        for index in top_indices
    ]


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "model_input_size": [MODEL_INPUT_WIDTH, MODEL_INPUT_HEIGHT],
            "label_count": len(labels),
        }
    )


@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["image"]
        image = Image.open(io.BytesIO(file.read()))

        prediction = predict_scores(image)
        top_predictions = build_top_predictions(prediction)

        index = int(np.argmax(prediction))
        confidence = round(float(prediction[0][index]) * 100, 2)
        result = labels[index]

        return jsonify(
            {
                "result": result,
                "prediction": result,
                "confidence": confidence,
                "top_predictions": top_predictions,
                "model_input_size": [MODEL_INPUT_WIDTH, MODEL_INPUT_HEIGHT],
            }
        )

    except Exception as error:
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
