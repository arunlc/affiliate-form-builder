# apps/core/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.forms.models import Form
from apps.leads.models import Lead
from apps.affiliates.models import Affiliate

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        if user.user_type == 'admin':
            # Admin dashboard data
            return Response({
                'user_type': 'admin',
                'total_forms': Form.objects.count(),
                'total_leads': Lead.objects.count(),
                'total_affiliates': Affiliate.objects.count(),
                'recent_leads': Lead.objects.order_by('-created_at')[:5].values(
                    'email', 'name', 'status', 'created_at'
                )
            })
        elif user.user_type == 'affiliate':
            # Affiliate dashboard data
            try:
                affiliate = Affiliate.objects.get(user=user)
                return Response({
                    'user_type': 'affiliate',
                    'my_leads': affiliate.total_leads,
                    'conversions': affiliate.total_conversions,
                    'conversion_rate': affiliate.conversion_rate,
                    'recent_leads': Lead.objects.filter(affiliate=affiliate).order_by('-created_at')[:5].values(
                        'email', 'name', 'status', 'created_at'
                    )
                })
            except Affiliate.DoesNotExist:
                return Response({
                    'user_type': 'affiliate',
                    'error': 'Affiliate profile not found'
                })
        elif user.user_type == 'operations':
            # Operations dashboard data
            return Response({
                'user_type': 'operations',
                'total_leads': Lead.objects.count(),
                'pending_leads': Lead.objects.filter(status='new').count(),
                'qualified_leads': Lead.objects.filter(status='qualified').count(),
                'recent_leads': Lead.objects.order_by('-created_at')[:10].values(
                    'email', 'name', 'status', 'form__name', 'created_at'
                )
            })
        
        return Response({'error': 'Invalid user type'})

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # TODO: Implement analytics aggregation
        return Response({
            'daily_submissions': [],
            'conversion_rates': [],
            'top_forms': [],
            'top_affiliates': []
        })

class SettingsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # TODO: Return system settings
        return Response({
            'email_notifications': True,
            'auto_assign_leads': False,
            'default_form_theme': 'modern'
        })
    
    def post(self, request):
        # TODO: Update system settings
        return Response({'message': 'Settings updated successfully'})
