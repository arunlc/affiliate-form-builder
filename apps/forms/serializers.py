# apps/forms/serializers.py
from rest_framework import serializers
from .models import Form, FormField

class FormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormField
        fields = '__all__'

class FormSerializer(serializers.ModelSerializer):
    fields = FormFieldSerializer(many=True, read_only=True)
    
    class Meta:
        model = Form
        fields = '__all__'
        read_only_fields = ('id', 'embed_code', 'created_by', 'created_at', 'updated_at')
