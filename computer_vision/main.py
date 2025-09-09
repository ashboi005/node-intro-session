import cv2
import mediapipe as mp
import numpy as np
import math
from collections import deque

# -------------------------
# 📌 Mediapipe Pose setup
# -------------------------
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.7, min_tracking_confidence=0.7)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)   # wider frame
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)   # taller frame

angle_history = deque(maxlen=5)
current_status = "Unknown"

# -------------------------
# 🔹 Helper functions
# -------------------------
def calculate_forward_angle(a, b):
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    return abs(math.degrees(math.atan2(dx, dy)))

def classify_posture(angle):
    if angle < 20:
        return "Good posture"
    elif angle < 25:
        return "Slight slouch"
    else:
        return "Severe slouch"

# -------------------------
# 🔹 Frame + Posture Detection
# -------------------------
def get_frame_and_status():
    global current_status

    if not cap.isOpened():
        return None, "Camera not opened"

    ret, frame = cap.read()
    if not ret:
        return None, "Failed to capture frame"

    # Resize just in case capture is lower
    frame = cv2.resize(frame, (1280, 720))
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    if results.pose_landmarks:
        h, w, _ = frame.shape
        lm = results.pose_landmarks.landmark

        left_ear = lm[mp_pose.PoseLandmark.LEFT_EAR]
        right_ear = lm[mp_pose.PoseLandmark.RIGHT_EAR]
        left_ear_px = (int(left_ear.x * w), int(left_ear.y * h))
        right_ear_px = (int(right_ear.x * w), int(right_ear.y * h))
        ear_distance = abs(left_ear_px[0] - right_ear_px[0])

        pts = []
        for ear_id, shoulder_id in [
            (mp_pose.PoseLandmark.RIGHT_EAR, mp_pose.PoseLandmark.RIGHT_SHOULDER),
            (mp_pose.PoseLandmark.LEFT_EAR, mp_pose.PoseLandmark.LEFT_SHOULDER),
        ]:
            ear, shoulder = lm[ear_id], lm[shoulder_id]
            if ear.visibility > 0.5 and shoulder.visibility > 0.5:
                ear_px = (int(ear.x * w), int(ear.y * h))
                shoulder_px = (int(shoulder.x * w), int(shoulder.y * h))
                angle = calculate_forward_angle(ear_px, shoulder_px)
                pts.append((ear_px, shoulder_px, angle))

        if pts:
            neck_forward_angle = np.mean([p[2] for p in pts])
            angle_history.append(neck_forward_angle)
            smoothed_angle = sum(angle_history) / len(angle_history)

            current_status = classify_posture(smoothed_angle)

            for ear_px, shoulder_px, _ in pts:
                cv2.circle(image, ear_px, 6, (0, 0, 255), -1)
                cv2.circle(image, shoulder_px, 6, (0, 255, 0), -1)
                cv2.line(image, ear_px, shoulder_px, (255, 255, 0), 2)

            display_text = f"{current_status} ({smoothed_angle:.1f}°)"
            if ear_distance > 70:
                display_text = "Front facing — shift camera sideways"

            put(image, display_text)

        else:
            current_status = "Not visible"

        mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
    else:
        current_status = "No landmarks"

    return image, current_status

# -------------------------
# 🔹 Put text on frame
# -------------------------
def put(frame, text):
    cv2.putText(frame, text,
                (40, 60), cv2.FONT_HERSHEY_SIMPLEX,
                1.2, (0, 0, 255), 3)

# -------------------------
# 🔹 Run live camera
# -------------------------
if __name__ == "__main__":
    cv2.namedWindow("Posture Corrector", cv2.WINDOW_NORMAL)  # make resizable
    cv2.resizeWindow("Posture Corrector", 1280, 720)         # bigger window

    while True:
        frame, status = get_frame_and_status()
        if frame is None:
            continue

        cv2.imshow("Posture Corrector", frame)
        if cv2.waitKey(1) & 0xFF == 27:  # ESC to quit
            break

    cap.release()
    cv2.destroyAllWindows()
