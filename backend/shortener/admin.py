from django.contrib import admin
from .models import ShortURL, ClickStat

@admin.register(ShortURL)
class ShortURLAdmin(admin.ModelAdmin):
    list_display = ('short_code', 'original_url', 'user', 'click_count', 'created_at')
    search_fields = ('short_code', 'original_url')
    list_filter = ('created_at',)
    readonly_fields = ('click_count',)

@admin.register(ClickStat)
class ClickStatAdmin(admin.ModelAdmin):
    list_display = ('short_url', 'ip_address', 'clicked_at')
    list_filter = ('clicked_at',)