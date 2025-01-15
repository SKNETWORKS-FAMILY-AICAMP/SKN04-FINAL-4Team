from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class DialogHistory(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)


    def __str__(self):
        return f"[{self.pk}]{self.title}"
    
    class Meta:
        verbose_name_plural = 'Dialog histories'