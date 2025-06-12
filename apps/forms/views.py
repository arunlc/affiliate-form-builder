# apps/forms/views.py - Fix the EmbedFormView
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.clickjacking import xframe_options_exempt
from django.utils.decorators import method_decorator
from .models import Form, FormField  # THIS LINE WAS MISSING!
from .serializers import FormSerializer, FormFieldSerializer
import logging

logger = logging.getLogger(__name__)

class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return Form.objects.all().order_by('-created_at')
        return Form.objects.filter(created_by=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        form = serializer.save(created_by=self.request.user)
        
        # Create default form fields if none provided
        if not form.fields.exists():
            default_fields = [
                {
                    'field_type': 'text',
                    'label': 'Full Name',
                    'placeholder': 'Enter your full name',
                    'is_required': True,
                    'order': 1
                },
                {
                    'field_type': 'email',
                    'label': 'Email Address',
                    'placeholder': 'Enter your email address',
                    'is_required': True,
                    'order': 2
                },
                {
                    'field_type': 'text',
                    'label': 'Company',
                    'placeholder': 'Your company name',
                    'is_required': False,
                    'order': 3
                },
                {
                    'field_type': 'textarea',
                    'label': 'Message',
                    'placeholder': 'Tell us about your needs',
                    'is_required': False,
                    'order': 4
                }
            ]
            
            for field_data in default_fields:
                FormField.objects.create(form=form, **field_data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get form statistics"""
        try:
            form = self.get_object()
            
            # Calculate real statistics
            total_submissions = form.leads.count()
            total_conversions = form.leads.filter(status__in=['qualified', 'closed_won']).count()
            conversion_rate = (total_conversions / total_submissions * 100) if total_submissions > 0 else 0
            
            # Recent submissions (last 30 days)
            from django.utils import timezone
            from datetime import timedelta
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_submissions = form.leads.filter(created_at__gte=thirty_days_ago).count()
            
            return Response({
                'form_id': str(form.id),
                'form_name': form.name,
                'total_submissions': total_submissions,
                'total_conversions': total_conversions,
                'conversion_rate': round(conversion_rate, 2),
                'recent_submissions': recent_submissions,
                'created_at': form.created_at,
                'is_active': form.is_active,
                'embed_url': f"{request.scheme}://{request.get_host()}/embed/{form.id}/",
            })
        except Exception as e:
            logger.error(f"Error getting form stats: {e}")
            return Response({'error': str(e)}, status=500)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate an existing form"""
        try:
            original_form = self.get_object()
            
            # Create a copy of the form
            new_form = Form.objects.create(
                name=f"{original_form.name} (Copy)",
                description=original_form.description,
                form_type=original_form.form_type,
                fields_config=original_form.fields_config,
                styling_config=original_form.styling_config,
                created_by=request.user
            )
            
            # Copy all form fields
            for field in original_form.fields.all():
                FormField.objects.create(
                    form=new_form,
                    field_type=field.field_type,
                    label=field.label,
                    placeholder=field.placeholder,
                    is_required=field.is_required,
                    options=field.options,
                    order=field.order
                )
            
            return Response(FormSerializer(new_form).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error duplicating form: {e}")
            return Response({'error': str(e)}, status=500)

@method_decorator(xframe_options_exempt, name='dispatch')
class EmbedFormView(APIView):
    """Render embeddable form"""
    permission_classes = []  # No auth required for public forms
    
    def get(self, request, form_id):
        try:
            form = get_object_or_404(Form, id=form_id, is_active=True)
            
            context = {
                'form': form,
                'request': request,
            }
            
            response = render(request, 'embed/form.html', context)
            response['X-Frame-Options'] = 'ALLOWALL'
            response['Content-Security-Policy'] = "frame-ancestors *;"
            return response
            
        except Exception as e:
            return HttpResponse(f"Form not available: {str(e)}", status=500)
@method_decorator(csrf_exempt, name='dispatch')
class FormSubmissionView(APIView):
    """Handle form submissions - Fixed version"""
    permission_classes = []  # No authentication required for submissions
    
    def post(self, request, form_id):
        try:
            logger.info(f"Form submission for form: {form_id}")
            
            form = get_object_or_404(Form, id=form_id, is_active=True)
            
            # Extract form data
            form_data = request.data.get('form_data', {})
            affiliate_id = request.data.get('affiliate_id')
            utm_params = request.data.get('utm_params', {})
            
            logger.info(f"Form data received: {form_data}")
            
            # Get client IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0]
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            
            # Create lead from form submission
            from apps.leads.models import Lead
            from apps.affiliates.models import Affiliate
            
            # Find affiliate if provided
            affiliate = None
            if affiliate_id:
                try:
                    affiliate = Affiliate.objects.get(affiliate_code=affiliate_id)
                except Affiliate.DoesNotExist:
                    logger.warning(f"Affiliate not found: {affiliate_id}")
            
            # Extract email and name from form data
            email = form_data.get('email') or form_data.get('Email') or form_data.get('email_address')
            name = form_data.get('name') or form_data.get('full_name') or form_data.get('Name')
            phone = form_data.get('phone') or form_data.get('Phone')
            
            if not email:
                return JsonResponse({'error': 'Email is required'}, status=400)
            
            # Create the lead
            lead = Lead.objects.create(
                form=form,
                affiliate=affiliate,
                form_data=form_data,
                email=email,
                name=name or '',
                phone=phone or '',
                utm_source=utm_params.get('utm_source', ''),
                utm_medium=utm_params.get('utm_medium', ''),
                utm_campaign=utm_params.get('utm_campaign', ''),
                utm_term=utm_params.get('utm_term', ''),
                utm_content=utm_params.get('utm_content', ''),
                ip_address=ip_address,
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                status='new'
            )
            
            # Update affiliate stats if applicable
            if affiliate:
                affiliate.total_leads += 1
                affiliate.save()
            
            logger.info(f"Lead created successfully: {lead.id}")
            
            return JsonResponse({
                'status': 'success', 
                'message': 'Thank you! Your submission has been received.',
                'lead_id': str(lead.id)
            })
            
        except Exception as e:
            logger.error(f"Error in form submission: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': 'Submission failed'}, status=500)
