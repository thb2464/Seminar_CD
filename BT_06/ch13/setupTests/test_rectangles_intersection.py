import unittest

from rectangles_intersection import rect_intersection_area
class TestRectangleIntersectionArea(unittest.TestCase):
    def test_intersecting_rectangles(self):
        rect1 = (0, 0, 4, 4)
        rect2 = (2, 2, 6, 6)
        self.assertEqual(rect_intersection_area(rect1, rect2), 4)

    def test_intersecting_rectangles_swapped(self):
        rect1 = (2, 2, 6, 6)
        rect2 = (0, 0, 4, 4)
        self.assertEqual(rect_intersection_area(rect1, rect2), 4)

    def test_non_intersecting_rectangles(self):
        rect1 = (0, 0, 2, 2)
        rect2 = (3, 3, 5, 5)
        self.assertEqual(rect_intersection_area(rect1, rect2), 0)
    
    def test_should_fail(self):
        rect1 = (0, 0, 4, 4)
        rect2 = (2, 2, 6, 6)
        self.assertEqual(rect_intersection_area(rect1, rect2), 999)  # wrong on purpose

if __name__ == "__main__":
    unittest.main()