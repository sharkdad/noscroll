import logging

from django.conf import settings
from sched import scheduler
from threading import Lock, Thread
from time import sleep

from . import hn, reddit


class TaskThread:
    def __init__(self):
        self.lock = Lock()
        self.thread = Thread(target=run_tasks, daemon=True)
        self.started = False

    def start_once(self):
        if not self.started:
            with self.lock:
                if not self.started:
                    self.thread.start()
                    self.started = True


def init_task_thread_middleware(get_response):
    thread = TaskThread()

    def middleware(request):
        thread.start_once()
        return get_response(request)

    return middleware


def run_tasks():
    while True:
        try:
            logging.info("Starting task scheduler")
            sched = scheduler()
            keep_task_running(hn.sync_top_stories, sched)
            keep_task_running(reddit.sync_feeds, sched)
            keep_task_running(reddit.sync_top_submissions, sched)
            keep_task_running(reddit.refresh_relative_scoring, sched)
            sched.run()
        except Exception:
            logging.exception("Error running task scheduler")
        finally:
            delay_seconds = settings.TASK_DELAY.total_seconds()
            logging.error(
                "Task scheduler exited unexpectedly, restarting after %s seconds",
                delay_seconds,
            )
            sleep(delay_seconds)


def keep_task_running(task, sched):
    def run_task():
        try:
            task()
        except Exception:
            logging.exception("Error running task")
        finally:
            sched.enter(settings.TASK_DELAY.total_seconds(), 0, run_task)

    run_task()
