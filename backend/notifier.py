"""
Telegram notification utility.
Sends alerts to the next approver in the chain.
"""

import os
import logging
import requests as http_requests

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


def send_notification(role, message):
    """
    Send a Telegram alert about a pending request.
    In a production system, you'd look up the Telegram chat ID for users
    with the given role. For now, we send to the configured TELEGRAM_CHAT_ID.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "")

    if not token or not chat_id:
        logger.warning("Telegram not configured. Skipping alert for %s", role)
        return False

    text = (
        f"📋 <b>Outing Pass — Action Needed</b>\n\n"
        f"<b>To:</b> {role}\n"
        f"{message}"
    )

    try:
        url = TELEGRAM_API.format(token=token)
        resp = http_requests.post(
            url,
            json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML",
            },
            timeout=10,
        )
        resp.raise_for_status()
        logger.info("Telegram alert sent to %s", role)
        return True
    except http_requests.RequestException:
        logger.exception("Failed to send Telegram alert to %s", role)
        return False
