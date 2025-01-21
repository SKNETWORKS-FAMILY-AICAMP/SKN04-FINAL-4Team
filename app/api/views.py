from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import HistorySerializer
from history.models import DialogHistory
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
# Create your views here.
from sllm_poject.settings import DEBUG
from rest_framework_simplejwt.views import TokenObtainPairView


class HistoryList(generics.ListAPIView):
    if DEBUG:
        permission_classes = [AllowAny]
    else:
        permission_classes = [IsAuthenticated]

    serializer_class = HistorySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['title', 'author']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return DialogHistory.objects.all()
        else:
            return DialogHistory.objects.filter(author=user)

    def post(self, request):
        serializer = HistorySerializer(data=request.data)

        if serializer.is_valid():
            # User.objects.first()
            serializer.save(author=self.request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        instance_id = kwargs.get('id')
        history = get_object_or_404(DialogHistory, id=instance_id)
        history.delete()
        return Response({"message": "삭제되었습니다."}, status=status.HTTP_204_NO_CONTENT)
    
    def patch(self, request, *args, **kwargs):
        # 요청으로 전달된 데이터의 ID 가져오기
        instance_id = kwargs.get('id')
        instance = get_object_or_404(DialogHistory, id=instance_id)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(author=self.request.user)
            return Response({'message': '업데이트 되었습니다.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserTokenObtainPairView(TokenObtainPairView):
    pass