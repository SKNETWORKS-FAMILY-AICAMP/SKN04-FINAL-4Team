from django.urls import path
from .views import HistoryList, UserTokenObtainPairView, DeleteThreadId
from rest_framework.urlpatterns import format_suffix_patterns


urlpatterns = [
    path('history/', HistoryList.as_view()),
    path('history/<int:id>/', HistoryList.as_view()),
    path('delete_thread/', DeleteThreadId.as_view()),
    path('token/', UserTokenObtainPairView.as_view()),
    
]
urlpatterns = format_suffix_patterns(urlpatterns)