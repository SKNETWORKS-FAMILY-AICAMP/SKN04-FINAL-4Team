from django.urls import path
from .views import HistoryList, UserTokenObtainPairView
from rest_framework.urlpatterns import format_suffix_patterns


urlpatterns = [
    path('history/', HistoryList.as_view()),
    path('history/<int:pk>/', HistoryList.as_view()),
    path('token/', UserTokenObtainPairView.as_view()),
    
]
urlpatterns = format_suffix_patterns(urlpatterns)