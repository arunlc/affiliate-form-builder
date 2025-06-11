# apps/forms/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Form
from .serializers import FormSerializer

class FormViewSet(viewsets.ModelViewSet):
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return Form.objects.all()
        return Form.objects.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class EmbedFormView(APIView):
    """Render embeddable form"""
    
    def get(self, request, form_id):
        form = get_object_or_404(Form, id=form_id, is_active=True)
        context = {
            'form': form,
            'affiliate_id': request.GET.get('affiliate'),
            'utm_params': {
                'utm_source': request.GET.get('utm_source', ''),
                'utm_medium': request.GET.get('utm_medium', ''),
                'utm_campaign': request.GET.get('utm_campaign', ''),
                'utm_term': request.GET.get('utm_term', ''),
                'utm_content': request.GET.get('utm_content', ''),
            }
        }
        return render(request, 'embed/form.html', context)

@method_decorator(csrf_exempt, name='dispatch')
class FormSubmissionView(APIView):
    """Handle form submissions"""
    
    def post(self, request, form_id):
        form = get_object_or_404(Form, id=form_id, is_active=True)
        
        # Extract form data
        form_data = request.data.get('form_data', {})
        affiliate_id = request.data.get('affiliate_id')
        utm_params = request.data.get('utm_params', {})
        
        # Create lead (will implement in leads app)
        # TODO: Create lead with form submission data
        
        return JsonResponse({'status': 'success', 'message': 'Form submitted successfully'})

class FormStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, form_id):
        form = get_object_or_404(Form, id=form_id)
        # TODO: Return form statistics
        return Response({'form_id': form_id, 'stats': 'placeholder'})
