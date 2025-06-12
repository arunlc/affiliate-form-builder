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
        return Response({'message': 'Settings updated successfully'})
