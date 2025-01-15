from django.urls import path
from .views import HistoryList
from rest_framework.urlpatterns import format_suffix_patterns


urlpatterns = [
    path('history/', HistoryList.as_view()),
]
urlpatterns = format_suffix_patterns(urlpatterns)