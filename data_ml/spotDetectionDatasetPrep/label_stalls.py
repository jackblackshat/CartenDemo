import cv2
import json
import argparse
from pathlib import Path

WINDOW = "Stall Labeler"

def draw_overlay(img, current_pts, stalls):
    out = img.copy()

    # Draw polygon for each saved stall to display to user
    for stall in stalls:
        pts = stall["points"]
        for i in range(len(pts)):
            x1, y1 = pts[i]
            x2, y2 = pts[(i + 1) % len(pts)]
            cv2.line(out, (x1, y1), (x2, y2), (0, 255, 0), 2)
        # Label at centroid-ish
        cx = sum(p[0] for p in pts) // len(pts)
        cy = sum(p[1] for p in pts) // len(pts)
        cv2.putText(out, stall["id"], (cx, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    # Draw current polygon-in-progress
    for p in current_pts:
        cv2.circle(out, tuple(p), 4, (0, 0, 255), -1)

    for i in range(1, len(current_pts)):
        cv2.line(out, tuple(current_pts[i - 1]), tuple(current_pts[i]), (0, 0, 255), 2)

    # Instructions
    help_text = [
        "Click: add point",
        "u: undo point | r: reset current | n: name+save stall",
        "s: save stalls.json | q: quit",
    ]
    y = 22
    for line in help_text:
        cv2.putText(out, line, (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        y += 24

    return out

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True, help="Path to a reference frame image (jpg/png).")
    parser.add_argument("--out", default="stalls.json", help="Output JSON file.")
    parser.add_argument("--load", default=None, help="Optional existing stalls.json to load and continue editing.")
    args = parser.parse_args()

    img_path = Path(args.image)
    if not img_path.exists():
        raise FileNotFoundError(f"Image not found: {img_path}")

    img = cv2.imread(str(img_path))
    if img is None:
        raise RuntimeError("Failed to read image. Make sure it's a valid jpg/png.")

    stalls = []
    if args.load:
        load_path = Path(args.load)
        if load_path.exists():
            with open(load_path, "r") as f:
                stalls = json.load(f)
            print(f"Loaded {len(stalls)} stalls from {load_path}")

    current_pts = []

    def on_mouse(event, x, y, flags, param):
        nonlocal current_pts
        if event == cv2.EVENT_LBUTTONDOWN:
            current_pts.append([int(x), int(y)])

    cv2.namedWindow(WINDOW, cv2.WINDOW_NORMAL)
    cv2.setMouseCallback(WINDOW, on_mouse)

    while True:
        vis = draw_overlay(img, current_pts, stalls)
        cv2.imshow(WINDOW, vis)

        key = cv2.waitKey(20) & 0xFF

        if key == ord("q"):
            break

        elif key == ord("u"):  # undo
            if current_pts:
                current_pts.pop()

        elif key == ord("r"):  # reset current
            current_pts = []

        elif key == ord("n"):  # name + save current polygon
            if len(current_pts) < 3:
                print("Need at least 3 points to make a polygon.")
                continue

            stall_id = input("Enter stall id (e.g., A1): ").strip()
            if not stall_id:
                print("Stall id cannot be empty.")
                continue

            stalls.append({"id": stall_id, "points": current_pts})
            print(f"Saved stall {stall_id} with {len(current_pts)} points.")
            current_pts = []

        elif key == ord("s"):  # save all
            out_path = Path(args.out)
            with open(out_path, "w") as f:
                json.dump(stalls, f, indent=2)
            print(f"Wrote {len(stalls)} stalls to {out_path}")

    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()

#TO RUN GO TO DIRECTORY: python label_stalls.py --image "imageName".jpg --out stalls.json