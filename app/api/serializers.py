from history.models import DialogHistory 
from rest_framework import serializers


class HistorySerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField() 
    
    class Meta:
        model = DialogHistory
        fields = '__all__'
    