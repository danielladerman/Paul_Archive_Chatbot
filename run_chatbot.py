from dotenv import load_dotenv
import os

# Load environment variables from .env file at the absolute earliest point.
# This ensures that all modules, including config, will see the environment variables
# when they are imported.
load_dotenv()

# Now that the environment is set, we can import and run the chatbot application.
from src.chatbot import launch_app

if __name__ == "__main__":
    print("Environment loaded. Starting chatbot application...")
    launch_app() 