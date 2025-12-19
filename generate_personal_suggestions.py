from typing import List
import sys

from src.chatbot import PaulChatbot


def write_personal_suggestions_to_file(
    suggestions: List[str], output_path: str = "data/personal_suggestions.md"
) -> None:
    """
    Write the provided suggestions to a markdown file for personal review.

    Each suggestion is written as a numbered list item so it is easy to skim.
    """
    with open(output_path, "w", encoding="utf-8") as file:
        file.write("# Personal Topic Suggestions\n\n")
        for index, question in enumerate(suggestions, start=1):
            file.write(f"{index}. {question}\n")


def main() -> None:
    """
    Generate a configurable number of personal suggestions and write them to disk.

    You can optionally pass the desired count as a command-line argument, e.g.:

        python3 generate_personal_suggestions.py 200
    """
    num_suggestions = 100
    if len(sys.argv) >= 2:
        try:
            num_suggestions = int(sys.argv[1])
        except ValueError:
            print(f"Invalid suggestion count '{sys.argv[1]}', defaulting to {num_suggestions}.")

    chatbot = PaulChatbot()
    suggestions = chatbot.generate_suggestions(num_suggestions=num_suggestions)

    output_path = "data/personal_suggestions.md"
    write_personal_suggestions_to_file(suggestions, output_path)

    print(f"Wrote {len(suggestions)} suggestions to {output_path}")


if __name__ == "__main__":
    main()


