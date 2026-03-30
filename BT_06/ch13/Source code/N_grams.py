import re

def lowercase_remove_punct_numbers(text):
    return re.sub(r'[^a-z\s]', '', text.lower())

def multiple_to_single_spaces(text):
    return re.sub(r'\s+', ' ', text).strip()

def create_ngrams(text, n):
    processed_text = lowercase_remove_punct_numbers(text)
    processed_text = multiple_to_single_spaces(processed_text)
    
    words = processed_text.split()
    return [processed_text[i:i+n] for i in range(len(processed_text) - n + 1)]

if __name__ == "__main__":
    text = "This is a sample text $ABC% for creating n-grams."
    n = 3
    print(create_ngrams(text, n))