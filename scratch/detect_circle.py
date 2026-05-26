from PIL import Image
import sys

def detect_largest_white_blob(image_path):
    img = Image.open(image_path).convert('RGB')
    width, height = img.size
    
    # We will find white pixels
    white_pixels = set()
    for y in range(height):
        for x in range(width):
            r, g, b = img.getpixel((x, y))
            # White circle is very white
            if r > 245 and g > 245 and b > 245:
                white_pixels.add((x, y))
                
    # Connected component labeling (simple BFS)
    visited = set()
    components = []
    
    for px in white_pixels:
        if px in visited:
            continue
        # Start BFS for this component
        comp = []
        queue = [px]
        visited.add(px)
        
        while queue:
            curr = queue.pop(0)
            comp.append(curr)
            # Check 4-neighbors
            cx, cy = curr
            for nx, ny in [(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)]:
                if (nx, ny) in white_pixels and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
                    
        components.append(comp)
        
    if not components:
        print("No white components found")
        return
        
    # Find the largest component
    largest_comp = max(components, key=len)
    
    # Get bounding box of the largest component
    min_x = min(x for x, y in largest_comp)
    max_x = max(x for x, y in largest_comp)
    min_y = min(y for x, y in largest_comp)
    max_y = max(y for x, y in largest_comp)
    
    scale = 1080.0 / width
    scaled_min_x = min_x * scale
    scaled_max_x = max_x * scale
    scaled_min_y = min_y * scale
    scaled_max_y = max_y * scale
    
    frame_width = scaled_max_x - scaled_min_x
    frame_height = scaled_max_y - scaled_min_y
    center_x = (scaled_min_x + scaled_max_x) / 2
    center_y = (scaled_min_y + scaled_max_y) / 2
    
    print(f"Largest white component size (pixels): {len(largest_comp)}")
    print(f"Original Box: x1={min_x}, y1={min_y}, x2={max_x}, y2={max_y}")
    print(f"Scaled Box (1080x1920):")
    print(f"  Min X (x): {scaled_min_x:.1f}")
    print(f"  Min Y (y): {scaled_min_y:.1f}")
    print(f"  Width: {frame_width:.1f}")
    print(f"  Height: {frame_height:.1f}")
    print(f"  BorderRadius: {(frame_width / 2):.1f}")
    print(f"  Center X: {center_x:.1f}, Center Y: {center_y:.1f}")

detect_largest_white_blob('public/finally-made-it.jpg')
