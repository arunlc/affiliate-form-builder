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
    queryset = Affiliate.objects.all()
    
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

class AffiliateStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, affiliate_id):
        # TODO: Return affiliate statistics
        return Response({'affiliate_id': affiliate_id, 'stats': 'placeholder'})

class AffiliateLeadsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, affiliate_id):
        # TODO: Return affiliate leads
        return Response({'affiliate_id': affiliate_id, 'leads': []})
