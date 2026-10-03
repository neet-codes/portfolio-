"""
Extract 64 high-quality WebP frames along the 360° circular head rotation trajectory
and the neutral center frame from public/character.mp4.

Compass Directions Mapping:
- RIGHT (0°): Frame 80
- DOWN-RIGHT (45°): Frame 102
- DOWN (90°): Frame 122
- DOWN-LEFT (135°): Frame 144
- LEFT (180°): Frame 168
- UP-LEFT (225°): Frame 194
- UP (270°): Frame 28
- UP-RIGHT (315°): Frame 52
- CENTER (neutral eye contact): Frame 235
- Background RGB: [154, 35, 32] -> Hex: #9a2320
"""

import os
import cv2
import numpy as np

def extract_all():
    video_path = os.path.join("public", "character.mp4")
    out_dir = os.path.join("public", "frames")
    os.makedirs(out_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video at {video_path}")
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Video Loaded: {width}x{height}, {fps} FPS, {total_frames} frames")
    
    # 1. Extract CENTER neutral frame
    center_frame_idx = 235
    cap.set(cv2.CAP_PROP_POS_FRAMES, center_frame_idx)
    ret, frame_center = cap.read()
    if ret:
        center_path = os.path.join("public", "center.webp")
        cv2.imwrite(center_path, frame_center, [cv2.IMWRITE_WEBP_QUALITY, 92])
        print(f"Saved {center_path} from video frame {center_frame_idx}")
    else:
        raise RuntimeError("Failed to read center frame")
        
    # 2. Build 64 circular trajectory frames (each ~5.625° apart)
    frames_spec = []

    # Sector 0: Indices 0..7 (RIGHT 0° to DOWN-RIGHT 45°: video frames 80 to 102)
    s0 = np.linspace(80, 102, 9)[:-1]
    for f in s0:
        frames_spec.append((int(round(f)), False))

    # Sector 1: Indices 8..15 (DOWN-RIGHT 45° to DOWN 90°: video frames 102 to 122)
    s1 = np.linspace(102, 122, 9)[:-1]
    for f in s1:
        frames_spec.append((int(round(f)), False))

    # Sector 2: Indices 16..23 (DOWN 90° to DOWN-LEFT 135°: video frames 122 to 144)
    s2 = np.linspace(122, 144, 9)[:-1]
    for f in s2:
        frames_spec.append((int(round(f)), False))

    # Sector 3: Indices 24..31 (DOWN-LEFT 135° to LEFT 180°: video frames 144 to 168)
    s3 = np.linspace(144, 168, 9)[:-1]
    for f in s3:
        frames_spec.append((int(round(f)), False))

    # Sector 4: Indices 32..39 (LEFT 180° to UP-LEFT 225°: video frames 168 to 194)
    s4 = np.linspace(168, 194, 9)[:-1]
    for f in s4:
        frames_spec.append((int(round(f)), False))

    # Sector 5: Indices 40..47 (UP-LEFT 225° to UP 270°)
    # Carefully curated frames with zero blinks and continuous neck rotation
    s5 = [
        (194, False),
        (198, False),
        (52, True),   # Horizontally flipped for symmetric, continuous left tilt
        (46, True),
        (40, True),
        (34, True),
        (26, False),
        (27, False)
    ]
    frames_spec.extend(s5)

    # Sector 6: Indices 48..55 (UP 270° to UP-RIGHT 315°)
    # Skips frames 35-38 where eyes blink, preserving wide-open alert eyes
    s6 = [
        (28, False),
        (30, False),
        (32, False),
        (34, False),
        (40, False),
        (43, False),
        (46, False),
        (49, False)
    ]
    frames_spec.extend(s6)

    # Sector 7: Indices 56..63 (UP-RIGHT 315° to RIGHT 360°/0°: video frames 52 to 80)
    s7 = np.linspace(52, 80, 9)[:-1]
    for f in s7:
        frames_spec.append((int(round(f)), False))

    assert len(frames_spec) == 64, f"Expected 64 frame specifications, got {len(frames_spec)}"

    # 3. Extract each frame as WebP
    for idx, (f_num, flip_h) in enumerate(frames_spec):
        cap.set(cv2.CAP_PROP_POS_FRAMES, f_num)
        ret, frame = cap.read()
        if not ret:
            print(f"Warning: could not read frame {f_num}")
            continue
        if flip_h:
            frame = cv2.flip(frame, 1)
            
        frame_name = f"frame_{idx}.webp"
        frame_path = os.path.join(out_dir, frame_name)
        cv2.imwrite(frame_path, frame, [cv2.IMWRITE_WEBP_QUALITY, 92])

    cap.release()
    print(f"Successfully extracted all 64 WebP frames into {out_dir}/ and center.webp into public/")

if __name__ == "__main__":
    extract_all()
