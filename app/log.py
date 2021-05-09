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


class UTCFormatter(logging.Formatter):
    converter = time.gmtime
    default_time_format = "%Y-%m-%dT%H:%M:%S"
    default_msec_format = "%s.%03dZ"


class JSONFormatter(UTCFormatter):
    def format(self, record):
        record.message = super().format(record)
        data = {k: v for k, v in vars(record).items() if k not in BAD_LOG_RECORD_ATTRS}
        data["asctime"] = self.formatTime(record)

        if is_transient(record):
            data["levelname"] = logging.getLevelName(logging.WARNING)

        return json.dumps(data, default=str)


class GunicornAccessLogJSONFormatter(UTCFormatter):
    converter = time.gmtime
    default_time_format = "%Y-%m-%dT%H:%M:%S"
    default_msec_format = "%s.%03dZ"

    def format(self, record):
        message = super().format(record)
        levelname = (
            logging.getLevelName(logging.WARNING)
            if record.levelno > logging.WARNING
            else record.levelname
        )

        return json.dumps(
            dict(
                name=record.name,
                levelname=levelname,
                asctime=self.formatTime(record),
                message=message,
                method=record.args["m"],
                path=record.args["U"],
                status=record.args["s"],
                ua=record.args["a"],
                time_ms=record.args["M"],
            )
        )


def is_transient(record: logging.LogRecord) -> bool:
    if record.levelno <= logging.WARNING or record.exc_info is None:
        return False
    _, exc, _ = record.exc_info
    msg = str(exc)
    if msg == "received 503 HTTP response":
        return True
    return False
