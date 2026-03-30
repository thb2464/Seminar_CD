def rect_intersection_area(rect1, rect2):
    """
    Calculate the intersection area of two rectangles.
    Returns:
        - area (int/float) if valid
        - None if any rectangle is invalid
    """

    def is_valid(rect):
        if not isinstance(rect, (tuple, list)) or len(rect) != 4:
            return False
        x1, y1, x2, y2 = rect
        return x1 < x2 and y1 < y2

    # Return None instead of raising error
    if not is_valid(rect1) or not is_valid(rect2):
        return None

    x1_min, y1_min, x1_max, y1_max = rect1
    x2_min, y2_min, x2_max, y2_max = rect2

    x_overlap = max(0, min(x1_max, x2_max) - max(x1_min, x2_min))
    y_overlap = max(0, min(y1_max, y2_max) - max(y1_min, y2_min))

    return x_overlap * y_overlap