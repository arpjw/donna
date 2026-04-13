"""
Dead letter queue handler for failed Celery tasks.

Uses the task_failure signal to intercept all task failures after retries are
exhausted, logs them, and writes a record to the audit_log table.
"""
import logging
import traceback as tb_module

from celery.signals import task_failure

from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="workers.dead_letter.handle_failed_task",
    bind=True,
    max_retries=0,
    ignore_result=True,
)
def handle_failed_task(self, task_name: str, args_repr: str, kwargs_repr: str, exception_repr: str, retry_count: int):
    """
    Receives context about a failed task, logs it, and writes to audit_log.
    Never raises — DLQ handler must not itself fail.
    """
    try:
        logger.error(
            "DEAD LETTER: task=%s retries=%d exception=%s args=%s kwargs=%s",
            task_name,
            retry_count,
            exception_repr,
            args_repr,
            kwargs_repr,
        )
        _write_audit(task_name, args_repr, kwargs_repr, exception_repr, retry_count)
    except Exception as e:
        logger.error("Dead letter handler itself failed (non-fatal): %s", e)


def _write_audit(task_name, args_repr, kwargs_repr, exception_repr, retry_count):
    """Write audit log synchronously via a new event loop. Never raises."""
    import asyncio
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_write_audit_async(task_name, args_repr, kwargs_repr, exception_repr, retry_count))
        finally:
            loop.close()
    except Exception as e:
        logger.error("Dead letter audit write failed: %s", e)


async def _write_audit_async(task_name, args_repr, kwargs_repr, exception_repr, retry_count):
    try:
        from app.services.audit import write as audit_write
        await audit_write(
            user_id=None,
            event_type="task_failed",
            entity_type=None,
            entity_id=None,
            entity_title=task_name,
            metadata={
                "exception": exception_repr,
                "args_repr": args_repr,
                "kwargs_repr": kwargs_repr,
                "retry_count": retry_count,
            },
        )
    except Exception as e:
        logger.error("Dead letter audit_write failed: %s", e)


@task_failure.connect
def on_task_failure(sender=None, task_id=None, exception=None, args=None, kwargs=None, traceback=None, einfo=None, **kw):
    """
    Connected to Celery's task_failure signal. Fires for every task failure,
    including final failures after all retries are exhausted.
    Enqueues handle_failed_task so the DLQ write happens asynchronously.
    """
    try:
        task_name = getattr(sender, "name", str(sender)) if sender else "unknown"
        retry_count = getattr(sender.request, "retries", 0) if sender and hasattr(sender, "request") else 0
        exception_repr = repr(exception) if exception else "unknown"
        args_repr = repr(args)[:500] if args else "[]"
        kwargs_repr = repr(kwargs)[:500] if kwargs else "{}"

        handle_failed_task.apply_async(
            args=[task_name, args_repr, kwargs_repr, exception_repr, retry_count],
            queue="dead_letter",
        )
    except Exception as e:
        logger.error("on_task_failure signal handler failed (non-fatal): %s", e)
