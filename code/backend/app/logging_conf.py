import logging
import sys
from logging.handlers import RotatingFileHandler

def setup_logging(log_file: str = "logs/app.log"):
    # Create a custom formatter
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Stream handler (console)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger

# Initialize on import
logger = setup_logging()