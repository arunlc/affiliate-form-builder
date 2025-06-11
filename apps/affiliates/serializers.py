# apps/affiliates/serializers.py
from rest_framework import serializers
from .models import Affiliate

class AffiliateSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Affiliate
        fields = '__all__'
        read_only_fields = ('id', 'total_leads', 'total_conversions', 'created_at', 'updated_at')
