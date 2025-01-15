from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import HistorySerializer
from history.models import DialogHistory
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
# Create your views here.


class HistoryList(generics.ListAPIView):
    permission_classes = [IsAuthenticated] 
    serializer_class = HistorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id', 'title']

    def get_queryset(self):
        # 현재 사용자와 관련된 데이터만 반환
        # return DialogHistory.objects.filter(author=self.request.user)
        return DialogHistory.objects.all()

    def post(self, requset):
        serializer = HistorySerializer(data=requset.data)

        if serializer.is_valid():
            default_author = User.objects.first()
            serializer.save(author=default_author)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
