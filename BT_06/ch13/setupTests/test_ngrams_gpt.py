import unittest
from unittest.mock import patch
import re

# Assuming functions are imported from the module under test
from N_grams import lowercase_remove_punct_numbers, multiple_to_single_spaces, create_ngrams

class TestTextProcessing(unittest.TestCase):

    def test_lowercase_remove_punct_numbers_basic(self):
        text = "Hello, World! 123"
        expected = "hello world "
        result = lowercase_remove_punct_numbers(text)
        self.assertEqual(result, expected)

    def test_lowercase_remove_punct_numbers_only_letters(self):
        text = "ABCdef"
        expected = "abcdef"
        result = lowercase_remove_punct_numbers(text)
        self.assertEqual(result, expected)

    def test_lowercase_remove_punct_numbers_empty(self):
        text = ""
        expected = ""
        result = lowercase_remove_punct_numbers(text)
        self.assertEqual(result, expected)

    def test_multiple_to_single_spaces_basic(self):
        text = "hello   world"
        expected = "hello world"
        result = multiple_to_single_spaces(text)
        self.assertEqual(result, expected)

    def test_multiple_to_single_spaces_with_tabs_newlines(self):
        text = "hello\t\nworld"
        expected = "hello world"
        result = multiple_to_single_spaces(text)
        self.assertEqual(result, expected)

    def test_multiple_to_single_spaces_single_space(self):
        text = "hello world"
        expected = "hello world"
        result = multiple_to_single_spaces(text)
        self.assertEqual(result, expected)

    def test_create_ngrams_basic(self):
        text = "abcde"
        n = 2
        expected = ["ab", "bc", "cd", "de"]
        result = create_ngrams(text, n)
        self.assertEqual(result, expected)

    def test_create_ngrams_with_cleaning(self):
        text = "A!B@C"
        n = 2
        # cleaned text becomes "abc"
        expected = ["ab", "bc"]
        result = create_ngrams(text, n)
        self.assertEqual(result, expected)

    def test_create_ngrams_with_spaces(self):
        text = "a   b c"
        n = 3
        # cleaned + normalized: "a b c"
        expected = ["a b", " b ", "b c"]
        result = create_ngrams(text, n)
        self.assertEqual(result, expected)

    def test_create_ngrams_n_equals_length(self):
        text = "abcd"
        n = 4
        expected = ["abcd"]
        result = create_ngrams(text, n)
        self.assertEqual(result, expected)

    def test_create_ngrams_n_greater_than_length(self):
        text = "abc"
        n = 5
        expected = []
        result = create_ngrams(text, n)
        self.assertEqual(result, expected)

    @patch("re.sub")
    def test_lowercase_remove_punct_numbers_uses_regex(self, mock_sub):
        mock_sub.return_value = "mocked"
        result = lowercase_remove_punct_numbers("Test123!")
        mock_sub.assert_called_once()
        self.assertEqual(result, "mocked")


if __name__ == "__main__":
    unittest.main()