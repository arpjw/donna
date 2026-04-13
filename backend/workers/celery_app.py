from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "donna",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "workers.ingestion.federal_register",
        "workers.ingestion.sec_edgar",
        "workers.ingestion.cfpb",
        "workers.ingestion.california_ag",
        "workers.ingestion.new_york_ag",
        "workers.processing.enrichment",
        "workers.processing.embedding",
        "workers.relevance.scorer",
        "workers.delivery.alert_sender",
        "workers.delivery.digest_builder",
        "workers.dead_letter",
        "workers.monitoring",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_reject_on_worker_lost=True,
    broker_connection_retry_on_startup=True,
    # Dead letter queue — failed tasks are routed here after all retries exhausted
    task_queues={
        "celery": {"exchange": "celery", "routing_key": "celery"},
        "dead_letter": {"exchange": "dead_letter", "routing_key": "dead_letter"},
    },
    task_routes={
        "workers.dead_letter.handle_failed_task": {"queue": "dead_letter"},
    },
)

celery_app.conf.beat_schedule = {
    "ingest-federal-register": {
        "task": "workers.ingestion.federal_register.run",
        "schedule": crontab(minute=0, hour="*/4"),
    },
    "ingest-sec-edgar": {
        "task": "workers.ingestion.sec_edgar.run",
        "schedule": crontab(minute=30, hour="*/2"),
    },
    "ingest-cfpb": {
        "task": "workers.ingestion.cfpb.run",
        "schedule": crontab(minute=0, hour="*/12"),
    },
    "send-daily-digests": {
        "task": "workers.delivery.digest_builder.send_daily_digests",
        "schedule": crontab(minute=0, hour=8),
    },
    "send-weekly-digests": {
        "task": "workers.delivery.digest_builder.send_weekly_digests",
        "schedule": crontab(minute=0, hour=8, day_of_week="monday"),
    },
    "check-ingestion-health": {
        "task": "workers.monitoring.check_ingestion_health",
        "schedule": crontab(minute=0),
    },
    "ingest-california-ag": {
        "task": "workers.ingestion.california_ag.run",
        "schedule": crontab(minute=0, hour="*/12"),
    },
    "ingest-new-york-ag": {
        "task": "workers.ingestion.new_york_ag.run",
        "schedule": crontab(minute=30, hour="*/12"),
    },
}
