# apps/forms/views.py - FIXED VERSION
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
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta, datetime
from .models import Form, FormField
from .serializers import FormSerializer, FormFieldSerializer
from apps.leads.models import Lead
from apps.affiliates.models import Affiliate
import logging
import json

logger = logging.getLogger(__name__)

class FormViewSet(viewsets.ModelViewSet):
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated]
    queryset = Form.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'admin':
            # Admins see all forms - FIXED: removed 'assigned_affiliates' prefetch
            return Form.objects.all().select_related('created_by').prefetch_related(
                'fields', 'affiliateformassignment_set__affiliate'
            ).order_by('-created_at')
        
        elif user.user_type == 'affiliate':
            # Affiliates only see forms assigned to them
            try:
                affiliate = Affiliate.objects.get(user=user)
                # Get forms through the AffiliateFormAssignment relationship
                assigned_form_ids = affiliate.affiliateformassignment_set.filter(
                    is_active=True
                ).values_list('form_id', flat=True)
                
                return Form.objects.filter(
                    id__in=assigned_form_ids,
                    is_active=True
                ).select_related('created_by').prefetch_related(
                    'fields', 'leads'
                ).order_by('-created_at')
            except Affiliate.DoesNotExist:
                return Form.objects.none()
        
        elif user.user_type == 'operations':
            # Operations see all forms (for lead management)
            return Form.objects.all().select_related('created_by').prefetch_related(
                'fields', 'leads'
            ).order_by('-created_at')
        
        return Form.objects.none()
    
    def perform_create(self, serializer):
        # Save the form first
        form = serializer.save(created_by=self.request.user)
        
        # Handle fields from the request data
        fields_data = self.request.data.get('fields', [])
        if fields_data:
            # Clear existing fields if updating
            form.fields.all().delete()
            
            # Create new fields
            for field_data in fields_data:
                FormField.objects.create(
                    form=form,
                    field_type=field_data.get('field_type', 'text'),
                    label=field_data.get('label', ''),
                    placeholder=field_data.get('placeholder', ''),
                    is_required=field_data.get('is_required', False),
                    options=field_data.get('options', []),
                    order=field_data.get('order', 0)
                )
        else:
            # Create default form fields if none provided
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
                }
            ]
            
            for field_data in default_fields:
                FormField.objects.create(form=form, **field_data)
    
    def perform_update(self, serializer):
        # Save the form first
        form = serializer.save()
        
        # Handle fields from the request data
        fields_data = self.request.data.get('fields', [])
        if fields_data:
            # Clear existing fields
            form.fields.all().delete()
            
            # Create new fields
            for field_data in fields_data:
                FormField.objects.create(
                    form=form,
                    field_type=field_data.get('field_type', 'text'),
                    label=field_data.get('label', ''),
                    placeholder=field_data.get('placeholder', ''),
                    is_required=field_data.get('is_required', False),
                    options=field_data.get('options', []),
                    order=field_data.get('order', 0)
                )
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get comprehensive form statistics with affiliate-specific data"""
        try:
            form = self.get_object()
            user = request.user
            
            # Get date range from query params
            days = int(request.query_params.get('days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            # Base queryset for leads
            leads_queryset = form.leads.all()
            
            # Filter by affiliate if user is affiliate
            if user.user_type == 'affiliate':
                try:
                    affiliate = Affiliate.objects.get(user=user)
                    leads_queryset = leads_queryset.filter(affiliate=affiliate)
                except Affiliate.DoesNotExist:
                    leads_queryset = Lead.objects.none()
            
            # Calculate statistics
            total_submissions = leads_queryset.count()
            period_submissions = leads_queryset.filter(created_at__gte=start_date).count()
            
            # Real conversion metrics
            total_conversions = leads_queryset.filter(
                status__in=['qualified', 'demo_completed', 'closed_won']
            ).count()
            period_conversions = leads_queryset.filter(
                created_at__gte=start_date,
                status__in=['qualified', 'demo_completed', 'closed_won']
            ).count()
            
            # Calculate conversion rates
            conversion_rate = (total_conversions / total_submissions * 100) if total_submissions > 0 else 0
            period_conversion_rate = (period_conversions / period_submissions * 100) if period_submissions > 0 else 0
            
            # Mock view data (we don't track views yet, so estimate)
            total_views = total_submissions * 3 if total_submissions > 0 else 0
            period_views = period_submissions * 3 if period_submissions > 0 else 0
            
            # Daily breakdown
            daily_data = []
            for i in range(days):
                date = start_date + timedelta(days=i)
                day_submissions = leads_queryset.filter(
                    created_at__date=date.date()
                ).count()
                daily_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'views': day_submissions * 3,  # Mock views
                    'submissions': day_submissions
                })
            
            # Traffic sources from leads
            traffic_sources = leads_queryset.exclude(utm_source='').values('utm_source').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
            
            # Format traffic sources with percentages
            formatted_sources = []
            for source in traffic_sources:
                source_name = source['utm_source'] or 'Direct'
                count = source['count']
                percentage = round(count / total_submissions * 100) if total_submissions > 0 else 0
                formatted_sources.append({
                    'source': source_name,
                    'count': count,
                    'percentage': percentage
                })
            
            # Recent activity - form submissions for this affiliate
            recent_leads = leads_queryset.order_by('-created_at')[:5]
            recent_activity = []
            for lead in recent_leads:
                hours_ago = (timezone.now() - lead.created_at).total_seconds() / 3600
                if hours_ago < 1:
                    time_str = f"{int(hours_ago * 60)} minutes ago"
                elif hours_ago < 24:
                    time_str = f"{int(hours_ago)} hours ago"
                else:
                    time_str = f"{int(hours_ago / 24)} days ago"
                
                recent_activity.append({
                    'action': 'Form submitted',
                    'details': lead.email,
                    'time': time_str
                })
            
            return Response({
                'form_id': str(form.id),
                'form_name': form.name,
                'total_submissions': total_submissions,
                'total_views': total_views,
                'conversion_rate': round(period_conversion_rate, 1),
                'period_submissions': period_submissions,
                'period_views': period_views,
                'bounce_rate': round(max(0, 100 - period_conversion_rate), 1),
                'avg_completion_time': 120,  # Mock data
                'created_at': form.created_at,
                'is_active': form.is_active,
                'embed_url': f"{request.scheme}://{request.get_host()}/embed/{form.id}/",
                'daily_data': daily_data,
                'traffic_sources': formatted_sources,
                'recent_activity': recent_activity,
                'date_range': {
                    'start': start_date.strftime('%Y-%m-%d'),
                    'end': end_date.strftime('%Y-%m-%d'),
                    'days': days
                },
                # Affiliate-specific data
                'affiliate_specific': user.user_type == 'affiliate'
            })
        except Exception as e:
            logger.error(f"Error getting form stats: {e}")
            return Response({'error': str(e)}, status=500)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate an existing form (Admin only)"""
        if request.user.user_type != 'admin':
            return Response({'error': 'Only admins can duplicate forms'}, status=403)
        
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
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Get form submissions (leads) - filtered by affiliate if applicable"""
        try:
            form = self.get_object()
            user = request.user
            
            # Base queryset
            queryset = form.leads.all()
            
            # Filter by affiliate if user is affiliate
            if user.user_type == 'affiliate':
                try:
                    affiliate = Affiliate.objects.get(user=user)
                    queryset = queryset.filter(affiliate=affiliate)
                except Affiliate.DoesNotExist:
                    queryset = Lead.objects.none()
            
            # Apply additional filters
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            date_range = request.query_params.get('date_range')
            if date_range:
                days = int(date_range)
                start_date = timezone.now() - timedelta(days=days)
                queryset = queryset.filter(created_at__gte=start_date)
            
            # Paginate results
            page_size = int(request.query_params.get('page_size', 20))
            offset = int(request.query_params.get('offset', 0))
            
            total_count = queryset.count()
            leads = queryset.select_related('affiliate').order_by('-created_at')[offset:offset + page_size]
            
            from apps.leads.serializers import LeadSerializer
            
            return Response({
                'form_id': str(form.id),
                'total_count': total_count,
                'results': LeadSerializer(leads, many=True).data,
                'has_more': offset + page_size < total_count,
                'affiliate_filtered': user.user_type == 'affiliate'
            })
        except Exception as e:
            logger.error(f"Error getting form submissions: {e}")
            return Response({'error': str(e)}, status=500)

# Keep existing EmbedFormView and FormSubmissionView unchanged
@method_decorator(xframe_options_exempt, name='dispatch')
class EmbedFormView(APIView):
    """Render embeddable form"""
    permission_classes = []
    
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
    """Handle form submissions"""
    permission_classes = []
    
    def post(self, request, form_id):
        try:
            logger.info(f"Form submission for form: {form_id}")
            
            form = get_object_or_404(Form, id=form_id, is_active=True)
            
            # Extract form data
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                form_data = data.get('form_data', {})
                affiliate_id = data.get('affiliate_id')
                utm_params = data.get('utm_params', {})
            else:
                form_data = dict(request.POST)
                affiliate_id = request.POST.get('affiliate_id')
                utm_params = {
                    'utm_source': request.POST.get('utm_source', ''),
                    'utm_medium': request.POST.get('utm_medium', ''),
                    'utm_campaign': request.POST.get('utm_campaign', ''),
                    'utm_term': request.POST.get('utm_term', ''),
                    'utm_content': request.POST.get('utm_content', ''),
                }
            
            # Get client IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0]
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            
            # Create lead from form submission
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
                
                # Update assignment stats
                try:
                    assignment = affiliate.affiliateformassignment_set.get(form=form)
                    assignment.update_stats()
                except:
                    pass
            
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
