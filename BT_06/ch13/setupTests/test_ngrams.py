import unittest
from ch13.N_grams import create_ngrams

class TestNGrams(unittest.TestCase):

    def test_create_ngrams(self):
        text = "This is a sample text"
        n = 2
        expected = ['th', 'hi', 'is', 'is', 'sa', 'am', 'mp', 'pl', 'le', 'te', 'ex', 'xt']
        self.assertEqual(create_ngrams(text, n), expected)

    def test_create_ngrams_with_special_characters(self):
        text = "Hello, World! 123"
        n = 3
        expected = ['hel', 'ell', 'llo', 'wor', 'orl', 'rld']
        self.assertEqual(create_ngrams(text, n), expected)

    def test_create_ngrams_empty_string(self):
        text = ""
        n = 2
        expected = []
        self.assertEqual(create_ngrams(text, n), expected)

if __name__ == "__main__":
    unittest.main()