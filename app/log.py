import json
import logging
import time


BAD_LOG_RECORD_ATTRS = set(
    [
        "msg",
        "args",
        "levelno",
        "filename",
        "exc_info",
        "exc_text",
        "stack_info",
        "created",
        "msecs",
        "relativeCreated",
        "thread",
        "threadName",
        "processName",
        "request",
    ]
)


class JSONFormatter(logging.Formatter):
    converter = time.gmtime
    default_time_format = "%Y-%m-%dT%H:%M:%S"
    default_msec_format = "%s.%03dZ"

    def format(self, record):
        record.message = super().format(record)
        data = {k: v for k, v in vars(record).items() if k not in BAD_LOG_RECORD_ATTRS}
        data["asctime"] = self.formatTime(record)
        return json.dumps(data, default=str)
