# apps/leads/serializers.py
from rest_framework import serializers
from .models import Lead, LeadNote

class LeadNoteSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = LeadNote
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class LeadSerializer(serializers.ModelSerializer):
    lead_notes = LeadNoteSerializer(many=True, read_only=True)
    affiliate_code = serializers.CharField(read_only=True)
    form_name = serializers.CharField(source='form.name', read_only=True)
    
    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
