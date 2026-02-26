import os
from typing import Any, Dict, Optional


class PromptService:
    """Service to load and inject context into markdown prompt files."""

    def __init__(self, prompts_dir: Optional[str] = None):
        if prompts_dir is None:
            # Default to the sibling directory
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.prompts_dir = os.path.join(base_dir, "prompts")
        else:
            self.prompts_dir = prompts_dir

    def get_prompt(self, name: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Retrieve a prompt by name and format it with the provided context."""
        file_path = os.path.join(self.prompts_dir, f"{name}.md")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Prompt file not found: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if context:
            try:
                return content.format(**context)
            except KeyError as e:
                # If a key is missing, we still want to return the content, 
                # maybe with placeholders or just as is.
                # For safety, we can use a more robust formatter or just log it.
                return content
        
        return content
