# apps/forms/views.py - Enhanced with complete functionality
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
import logging
import json

logger = logging.getLogger(__name__)

class FormViewSet(viewsets.ModelViewSet):
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return Form.objects.all().order_by('-created_at')
        return Form.objects.filter(created_by=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        form = serializer.save(created_by=self.request.user)
        
        # Create form fields if provided in the request
        fields_data = self.request.data.get('fields', [])
        if fields_data:
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
            # Create default form fields
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
        """Get comprehensive form statistics"""
        try:
            form = self.get_object()
            
            # Calculate statistics
            total_submissions = form.leads.count()
            total_conversions = form.leads.filter(
                status__in=['qualified', 'demo_completed', 'closed_won']
            ).count()
            conversion_rate = (total_conversions / total_submissions * 100) if total_submissions > 0 else 0
            
            # Recent submissions (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_submissions = form.leads.filter(created_at__gte=thirty_days_ago).count()
            
            # Monthly data for the last 6 months
            monthly_data = []
            for i in range(6):
                month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                month_submissions = form.leads.filter(
                    created_at__gte=month_start,
                    created_at__lte=month_end
                ).count()
                monthly_data.append({
                    'month': month_start.strftime('%b %Y'),
                    'submissions': month_submissions
                })
            
            # Top sources
            top_sources = form.leads.values('utm_source').annotate(
                count=Count('id')
            ).order_by('-count')[:5]
            
            return Response({
                'form_id': str(form.id),
                'form_name': form.name,
                'total_submissions': total_submissions,
                'total_conversions': total_conversions,
                'conversion_rate': round(conversion_rate, 2),
                'recent_submissions': recent_submissions,
                'monthly_data': monthly_data,
                'top_sources': list(top_sources),
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
    """Handle form submissions"""
    permission_classes = []  # No authentication required for submissions
    
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
            
            logger.info(f"Form data received: {form_data}")
            
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


# apps/leads/views.py - Enhanced lead management
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from .models import Lead, LeadNote
from .serializers import LeadSerializer, LeadNoteSerializer
import pandas as pd
import logging

logger = logging.getLogger(__name__)

class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Lead.objects.all()
        
        # Filter by user role
        if user.user_type == 'admin':
            queryset = Lead.objects.all()
        elif user.user_type == 'affiliate':
            queryset = Lead.objects.filter(affiliate__user=user)
        elif user.user_type == 'operations':
            queryset = Lead.objects.all()
        else:
            queryset = Lead.objects.none()
        
        # Apply filters from query parameters
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(name__icontains=search) |
                Q(form_data__icontains=search)
            )
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        utm_source = self.request.query_params.get('utm_source')
        if utm_source:
            queryset = queryset.filter(utm_source=utm_source)
        
        affiliate_code = self.request.query_params.get('affiliate')
        if affiliate_code:
            queryset = queryset.filter(affiliate__affiliate_code=affiliate_code)
        
        date_range = self.request.query_params.get('date_range')
        if date_range:
            now = timezone.now()
            if date_range == 'today':
                queryset = queryset.filter(created_at__date=now.date())
            elif date_range == 'week':
                week_ago = now - timedelta(days=7)
                queryset = queryset.filter(created_at__gte=week_ago)
            elif date_range == 'month':
                month_ago = now - timedelta(days=30)
                queryset = queryset.filter(created_at__gte=month_ago)
            elif date_range == 'quarter':
                quarter_ago = now - timedelta(days=90)
                queryset = queryset.filter(created_at__gte=quarter_ago)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a note to a lead"""
        try:
            lead = self.get_object()
            note_text = request.data.get('note', '').strip()
            
            if not note_text:
                return Response({'error': 'Note content is required'}, status=400)
            
            note = LeadNote.objects.create(
                lead=lead,
                user=request.user,
                note=note_text
            )
            
            return Response(LeadNoteSerializer(note).data, status=201)
        except Exception as e:
            logger.error(f"Error adding note: {e}")
            return Response({'error': str(e)}, status=500)
    
    @action(detail=True, methods=['get'])
    def notes(self, request, pk=None):
        """Get all notes for a lead"""
        try:
            lead = self.get_object()
            notes = lead.lead_notes.all().order_by('-created_at')
            return Response(LeadNoteSerializer(notes, many=True).data)
        except Exception as e:
            logger.error(f"Error getting notes: {e}")
            return Response({'error': str(e)}, status=500)

class ExportLeadsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get filtered leads based on query parameters
            user = request.user
            queryset = Lead.objects.all()
            
            # Apply role-based filtering
            if user.user_type == 'affiliate':
                queryset = queryset.filter(affiliate__user=user)
            
            # Apply search and filters
            search = request.query_params.get('search')
            if search:
                queryset = queryset.filter(
                    Q(email__icontains=search) |
                    Q(name__icontains=search)
                )
            
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            utm_source = request.query_params.get('utm_source')
            if utm_source:
                queryset = queryset.filter(utm_source=utm_source)
            
            # Convert to DataFrame
            data = []
            for lead in queryset.order_by('-created_at'):
                # Extract form data fields
                form_data = lead.form_data or {}
                row = {
                    'Email': lead.email,
                    'Name': lead.name,
                    'Phone': lead.phone,
                    'Form': lead.form.name,
                    'Status': lead.get_status_display(),
                    'Affiliate': lead.affiliate_code,
                    'UTM Source': lead.utm_source,
                    'UTM Medium': lead.utm_medium,
                    'UTM Campaign': lead.utm_campaign,
                    'Created': lead.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'Updated': lead.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'IP Address': lead.ip_address,
                }
                
                # Add form data fields
                for key, value in form_data.items():
                    if key not in ['email', 'name', 'phone']:  # Avoid duplicates
                        row[f'Form_{key.title()}'] = str(value) if value else ''
                
                data.append(row)
            
            df = pd.DataFrame(data)
            
            # Create Excel response
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            filename = f"leads_export_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            df.to_excel(response, index=False, engine='openpyxl')
            
            return response
            
        except Exception as e:
            logger.error(f"Export error: {e}")
            return Response({'error': 'Export failed'}, status=500)

class LeadStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            queryset = Lead.objects.all()
            
            # Apply role-based filtering
            if user.user_type == 'affiliate':
                queryset = queryset.filter(affiliate__user=user)
            
            # Calculate statistics
            total_leads = queryset.count()
            new_leads = queryset.filter(status='new').count()
            qualified_leads = queryset.filter(
                status__in=['qualified', 'demo_scheduled', 'demo_completed']
            ).count()
            closed_won = queryset.filter(status='closed_won').count()
            closed_lost = queryset.filter(status='closed_lost').count()
            
            # Conversion rates
            qualification_rate = (qualified_leads / total_leads * 100) if total_leads > 0 else 0
            close_rate = (closed_won / total_leads * 100) if total_leads > 0 else 0
            
            # Recent trends (last 30 days vs previous 30 days)
            now = timezone.now()
            thirty_days_ago = now - timedelta(days=30)
            sixty_days_ago = now - timedelta(days=60)
            
            recent_leads = queryset.filter(created_at__gte=thirty_days_ago).count()
            previous_leads = queryset.filter(
                created_at__gte=sixty_days_ago,
                created_at__lt=thirty_days_ago
            ).count()
            
            growth_rate = 0
            if previous_leads > 0:
                growth_rate = ((recent_leads - previous_leads) / previous_leads * 100)
            
            # Top sources
            top_sources = queryset.values('utm_source').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
            
            # Daily submissions for the last 30 days
            daily_data = []
            for i in range(30):
                date = (now - timedelta(days=i)).date()
                count = queryset.filter(created_at__date=date).count()
                daily_data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'submissions': count
                })
            
            return Response({
                'total_leads': total_leads,
                'new_leads': new_leads,
                'qualified_leads': qualified_leads,
                'closed_won': closed_won,
                'closed_lost': closed_lost,
                'qualification_rate': round(qualification_rate, 2),
                'close_rate': round(close_rate, 2),
                'recent_leads': recent_leads,
                'growth_rate': round(growth_rate, 2),
                'top_sources': list(top_sources),
                'daily_data': daily_data[::-1],  # Reverse to get chronological order
            })
            
        except Exception as e:
            logger.error(f"Stats error: {e}")
            return Response({'error': str(e)}, status=500)


# apps/affiliates/views.py - Enhanced affiliate management
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Affiliate
from .serializers import AffiliateSerializer
from apps.leads.models import Lead
import logging

logger = logging.getLogger(__name__)

class AffiliateViewSet(viewsets.ModelViewSet):
    serializer_class = AffiliateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only admins can manage affiliates
        if self.request.user.user_type == 'admin':
            return Affiliate.objects.all().order_by('-created_at')
        return Affiliate.objects.none()
    
    def perform_create(self, serializer):
        # Create user account for affiliate if it doesn't exist
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user_name = self.request.data.get('user_name')
        email = self.request.data.get('email', '')
        
        # Check if user already exists
        user, created = User.objects.get_or_create(
            username=user_name,
            defaults={
                'email': email,
                'user_type': 'affiliate',
                'affiliate_id': self.request.data.get('affiliate_code')
            }
        )
        
        if created:
            # Set a default password (should be changed on first login)
            user.set_password('changeme123')
            user.save()
        
        serializer.save(user=user)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get comprehensive affiliate statistics"""
        try:
            affiliate = self.get_object()
            
            # Calculate statistics
            total_leads = affiliate.leads.count()
            total_conversions = affiliate.leads.filter(
                status__in=['qualified', 'demo_completed', 'closed_won']
            ).count()
            conversion_rate = (total_conversions / total_leads * 100) if total_leads > 0 else 0
            
            # Revenue estimation (you can customize this based on your commission structure)
            closed_won = affiliate.leads.filter(status='closed_won').count()
            estimated_revenue = closed_won * 100  # $100 per conversion example
            
            # Time-based statistics
            now = timezone.now()
            
            # This month
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_leads = affiliate.leads.filter(created_at__gte=month_start).count()
            monthly_conversions = affiliate.leads.filter(
                created_at__gte=month_start,
                status__in=['qualified', 'demo_completed', 'closed_won']
            ).count()
            
            # This week
            week_start = now - timedelta(days=now.weekday())
            week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
            weekly_leads = affiliate.leads.filter(created_at__gte=week_start).count()
            weekly_conversions = affiliate.leads.filter(
                created_at__gte=week_start,
                status__in=['qualified', 'demo_completed', 'closed_won']
            ).count()
            
            # Top performing sources
            top_sources = affiliate.leads.values('utm_source').annotate(
                count=Count('id')
            ).order_by('-count')[:5]
            
            # Monthly performance for the last 6 months
            monthly_performance = []
            for i in range(6):
                month_date = now.replace(day=1) - timedelta(days=30*i)
                month_end = (month_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                month_leads = affiliate.leads.filter(
                    created_at__gte=month_date,
                    created_at__lte=month_end
                ).count()
                monthly_performance.append({
                    'month': month_date.strftime('%b %Y'),
                    'leads': month_leads
                })
            
            return Response({
                'affiliate_id': str(affiliate.id),
                'affiliate_code': affiliate.affiliate_code,
                'total_leads': total_leads,
                'total_conversions': total_conversions,
                'conversion_rate': round(conversion_rate, 2),
                'estimated_revenue': estimated_revenue,
                'monthly_leads': monthly_leads,
                'monthly_conversions': monthly_conversions,
                'weekly_leads': weekly_leads,
                'weekly_conversions': weekly_conversions,
                'top_sources': list(top_sources),
                'monthly_performance': monthly_performance[::-1],  # Reverse for chronological order
                'join_date': affiliate.created_at,
                'is_active': affiliate.is_active,
            })
        except Exception as e:
            logger.error(f"Error getting affiliate stats: {e}")
            return Response({'error': str(e)}, status=500)
    
    @action(detail=True, methods=['get'])
    def leads(self, request, pk=None):
        """Get leads for a specific affiliate"""
        try:
            affiliate = self.get_object()
            
            # Apply filters
            queryset = affiliate.leads.all()
            
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            date_range = request.query_params.get('date_range')
            if date_range:
                now = timezone.now()
                if date_range == 'today':
                    queryset = queryset.filter(created_at__date=now.date())
                elif date_range == 'week':
                    week_ago = now - timedelta(days=7)
                    queryset = queryset.filter(created_at__gte=week_ago)
                elif date_range == 'month':
                    month_ago = now - timedelta(days=30)
                    queryset = queryset.filter(created_at__gte=month_ago)
            
            # Serialize leads
            from apps.leads.serializers import LeadSerializer
            leads = queryset.order_by('-created_at')[:50]  # Limit to 50 most recent
            
            return Response({
                'affiliate_code': affiliate.affiliate_code,
                'total_count': queryset.count(),
                'leads': LeadSerializer(leads, many=True).data
            })
        except Exception as e:
            logger.error(f"Error getting affiliate leads: {e}")
            return Response({'error': str(e)}, status=500)


# apps/core/views.py - Enhanced dashboard views
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from apps.forms.models import Form
from apps.leads.models import Lead
from apps.affiliates.models import Affiliate
from django.db.models import Count
import logging

logger = logging.getLogger(__name__)

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            if user.user_type == 'admin':
                return self._get_admin_dashboard(request)
            elif user.user_type == 'affiliate':
                return self._get_affiliate_dashboard(request)
            elif user.user_type == 'operations':
                return self._get_operations_dashboard(request)
            
            return Response({'error': 'Invalid user type'})
        except Exception as e:
            logger.error(f"Dashboard error: {e}")
            return Response({'error': str(e)}, status=500)
    
    def _get_admin_dashboard(self, request):
        """Admin dashboard data"""
        # Basic counts
        total_forms = Form.objects.count()
        total_leads = Lead.objects.count()
        total_affiliates = Affiliate.objects.count()
        
        # Recent leads
        recent_leads = Lead.objects.order_by('-created_at')[:10].values(
            'email', 'name', 'status', 'created_at', 'form__name'
        )
        
        # Growth metrics (last 30 days vs previous 30 days)
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)
        
        recent_leads_count = Lead.objects.filter(created_at__gte=thirty_days_ago).count()
        previous_leads_count = Lead.objects.filter(
            created_at__gte=sixty_days_ago,
            created_at__lt=thirty_days_ago
        ).count()
        
        # Top performing forms
        top_forms = Form.objects.annotate(
            lead_count=Count('leads')
        ).order_by('-lead_count')[:5].values('name', 'lead_count')
        
        # Top affiliates
        top_affiliates = Affiliate.objects.annotate(
            lead_count=Count('leads')
        ).order_by('-lead_count')[:5].values('affiliate_code', 'user__username', 'lead_count')
        
        return Response({
            'user_type': 'admin',
            'total_forms': total_forms,
            'total_leads': total_leads,
            'total_affiliates': total_affiliates,
            'recent_leads': list(recent_leads),
            'recent_leads_count': recent_leads_count,
            'previous_leads_count': previous_leads_count,
            'top_forms': list(top_forms),
            'top_affiliates': list(top_affiliates),
        })
    
    def _get_affiliate_dashboard(self, request):
        """Affiliate dashboard data"""
        try:
            affiliate = Affiliate.objects.get(user=request.user)
            
            # Basic metrics
            my_leads = affiliate.total_leads
            conversions = affiliate.total_conversions
            conversion_rate = affiliate.conversion_rate
            
            # Recent leads
            recent_leads = affiliate.leads.order_by('-created_at')[:10].values(
                'email', 'name', 'status', 'created_at'
            )
            
            # Monthly performance
            now = timezone.now()
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_leads = affiliate.leads.filter(created_at__gte=month_start).count()
            
            return Response({
                'user_type': 'affiliate',
                'my_leads': my_leads,
                'conversions': conversions,
                'conversion_rate': conversion_rate,
                'monthly_leads': monthly_leads,
                'recent_leads': list(recent_leads),
                'affiliate_code': affiliate.affiliate_code,
            })
        except Affiliate.DoesNotExist:
            return Response({
                'user_type': 'affiliate',
                'error': 'Affiliate profile not found'
            })
    
    def _get_operations_dashboard(self, request):
        """Operations dashboard data"""
        # Basic counts
        total_leads = Lead.objects.count()
        pending_leads = Lead.objects.filter(status='new').count()
        qualified_leads = Lead.objects.filter(
            status__in=['qualified', 'demo_scheduled', 'demo_completed']
        ).count()
        
        # Recent leads with more details for operations
        recent_leads = Lead.objects.order_by('-created_at')[:15].values(
            'email', 'name', 'status', 'form__name', 'created_at', 'affiliate__affiliate_code'
        )
        
        # Status distribution
        status_distribution = Lead.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        return Response({
            'user_type': 'operations',
            'total_leads': total_leads,
            'pending_leads': pending_leads,
            'qualified_leads': qualified_leads,
            'recent_leads': list(recent_leads),
            'status_distribution': list(status_distribution),
        })

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get date range from query params
            days = int(request.query_params.get('days', 30))
            end_date = timezone.now()
            start_date = end_date - timedelta(days=days)
            
            # Daily submissions
            daily_submissions = []
            for i in range(days):
                date = start_date + timedelta(days=i)
                count = Lead.objects.filter(created_at__date=date.date()).count()
                daily_submissions.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'submissions': count
                })
            
            # Conversion funnel
            total_leads = Lead.objects.filter(created_at__gte=start_date).count()
            contacted = Lead.objects.filter(
                created_at__gte=start_date,
                status__in=['contacted', 'qualified', 'demo_scheduled', 'demo_completed', 'closed_won']
            ).count()
            qualified = Lead.objects.filter(
                created_at__gte=start_date,
                status__in=['qualified', 'demo_scheduled', 'demo_completed', 'closed_won']
            ).count()
            closed_won = Lead.objects.filter(
                created_at__gte=start_date,
                status='closed_won'
            ).count()
            
            conversion_funnel = [
                {'stage': 'Leads', 'count': total_leads},
                {'stage': 'Contacted', 'count': contacted},
                {'stage': 'Qualified', 'count': qualified},
                {'stage': 'Closed Won', 'count': closed_won},
            ]
            
            # Top sources
            top_sources = Lead.objects.filter(
                created_at__gte=start_date
            ).values('utm_source').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
            
            # Form performance
            form_performance = Form.objects.annotate(
                lead_count=Count('leads', filter=Lead.objects.filter(created_at__gte=start_date).query)
            ).order_by('-lead_count')[:10].values('name', 'lead_count')
            
            return Response({
                'daily_submissions': daily_submissions,
                'conversion_funnel': conversion_funnel,
                'top_sources': list(top_sources),
                'form_performance': list(form_performance),
                'date_range': {
                    'start': start_date.strftime('%Y-%m-%d'),
                    'end': end_date.strftime('%Y-%m-%d'),
                    'days': days
                }
            })
        except Exception as e:
            logger.error(f"Analytics error: {e}")
            return Response({'error': str(e)}, status=500)

class SettingsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Return current settings (you can expand this based on your needs)
        return Response({
            'email_notifications': True,
            'auto_assign_leads': False,
            'default_form_theme': 'modern',
            'lead_retention_days': 365,
            'affiliate_commission_rate': 10.0,
        })
    
    def post(self, request):
        # Update settings (implement based on your requirements)
        # You might want to create a Settings model to store these
        return Response({'message': 'Settings updated successfully'})# apps/forms/views.py - Enhanced with complete functionality
