import unittest
from N_grams import lowercase_remove_punct_numbers

class TestLowercaseRemovePunctNumbers(unittest.TestCase):
    def test_data_driven(self):
        test_cases = [
            ("Hello, World! 123", "hello world "),
            ("ABCdef", "abcdef"),
            ("1234!@#$", ""),
            ("", ""),
            ("MiXeD CaSe &*^%", "mixed case ")
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input=input_text):
                self.assertEqual(lowercase_remove_punct_numbers(input_text), expected)

if __name__ == "__main__":
    unittest.main()