import logging

from django.conf import settings
from sched import scheduler
from threading import Lock, Thread
from time import sleep

from . import hn, reddit

TASK_INIT_LOCK = Lock()
TASK_THREAD = None

def init_task_thread_middleware(get_response):
    def middleware(request):
        with TASK_INIT_LOCK:
            global TASK_THREAD
            if TASK_THREAD is None:
                TASK_THREAD = Thread(target=run_tasks, daemon=True)
                TASK_THREAD.start()
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
        except:
            logging.exception("Error running task scheduler")
        finally:
            delay_seconds = settings.TASK_DELAY.total_seconds()
            logging.error("Task scheduler exited unexpectedly, restarting after %s seconds", delay_seconds)
            sleep(delay_seconds)

def keep_task_running(task, sched):
    def run_task():
        try:
            task()
        except:
            logging.exception("Error running task")
        finally:
            sched.enter(settings.TASK_DELAY.total_seconds(), 0, run_task)
    run_task()