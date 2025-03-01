import uuid
from django.db import models
from django.contrib.auth.models import User

class ShortURL(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_url = models.TextField(null=False)
    short_code = models.CharField(max_length=10, unique=True, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='short_urls')
    click_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.short_code} -> {self.original_url[:50]}"

class ClickStat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    short_url = models.ForeignKey(ShortURL, on_delete=models.CASCADE, related_name='clicks')
    ip_address = models.CharField(max_length=50, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    clicked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Click on {self.short_url.short_code} at {self.clicked_at}"