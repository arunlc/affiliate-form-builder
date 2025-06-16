# apps/affiliates/views.py - Updated with form assignment management
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Affiliate, AffiliateFormAssignment
from .serializers import AffiliateSerializer
from apps.leads.models import Lead
from apps.forms.models import Form
import logging

logger = logging.getLogger(__name__)

class AffiliateViewSet(viewsets.ModelViewSet):
    serializer_class = AffiliateSerializer
    permission_classes = [IsAuthenticated]
    queryset = Affiliate.objects.all()
    
    def get_queryset(self):
        # Only admins can manage affiliates
        if self.request.user.user_type == 'admin':
            return Affiliate.objects.select_related('user').prefetch_related(
                'assigned_forms', 'leads'
            ).order_by('-created_at')
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
            
            # Form performance for assigned forms
            form_performance = []
            for assignment in affiliate.affiliateformassignment_set.filter(is_active=True):
                form = assignment.form
                form_leads = affiliate.leads.filter(form=form).count()
                form_conversions = affiliate.leads.filter(
                    form=form,
                    status__in=['qualified', 'demo_completed', 'closed_won']
                ).count()
                
                form_performance.append({
                    'form_id': str(form.id),
                    'form_name': form.name,
                    'leads': form_leads,
                    'conversions': form_conversions,
                    'conversion_rate': (form_conversions / form_leads * 100) if form_leads > 0 else 0
                })
            
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
                'form_performance': form_performance,
                'monthly_performance': monthly_performance[::-1],  # Reverse for chronological order
                'join_date': affiliate.created_at,
                'is_active': affiliate.is_active,
                'assigned_forms_count': affiliate.assigned_forms.filter(is_active=True).count()
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
            queryset = affiliate.leads.select_related('form')
            
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            form_id = request.query_params.get('form')
            if form_id:
                queryset = queryset.filter(form__id=form_id)
            
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
    
    @action(detail=True, methods=['get', 'post'])
    def form_assignments(self, request, pk=None):
        """Get or update form assignments for an affiliate"""
        affiliate = self.get_object()
        
        if request.method == 'GET':
            # Get current assignments
            assignments = AffiliateFormAssignment.objects.filter(
                affiliate=affiliate
            ).select_related('form').order_by('-assigned_at')
            
            assignment_data = []
            for assignment in assignments:
                assignment_data.append({
                    'id': assignment.id,
                    'form_id': str(assignment.form.id),
                    'form_name': assignment.form.name,
                    'form_description': assignment.form.description,
                    'is_active': assignment.is_active,
                    'assigned_at': assignment.assigned_at,
                    'leads_generated': assignment.leads_generated,
                    'conversions': assignment.conversions,
                    'conversion_rate': assignment.conversion_rate
                })
            
            # Also get available forms not assigned
            assigned_form_ids = [a.form.id for a in assignments if a.is_active]
            available_forms = Form.objects.filter(
                is_active=True
            ).exclude(id__in=assigned_form_ids).values(
                'id', 'name', 'description', 'form_type'
            )
            
            return Response({
                'affiliate_id': str(affiliate.id),
                'affiliate_code': affiliate.affiliate_code,
                'assignments': assignment_data,
                'available_forms': list(available_forms)
            })
        
        elif request.method == 'POST':
            # Update assignments
            form_ids = request.data.get('form_ids', [])
            
            try:
                # Deactivate all current assignments
                AffiliateFormAssignment.objects.filter(
                    affiliate=affiliate
                ).update(is_active=False)
                
                # Create/activate new assignments
                for form_id in form_ids:
                    try:
                        form = Form.objects.get(id=form_id, is_active=True)
                        assignment, created = AffiliateFormAssignment.objects.get_or_create(
                            affiliate=affiliate,
                            form=form,
                            defaults={
                                'assigned_by': request.user,
                                'is_active': True
                            }
                        )
                        if not created:
                            assignment.is_active = True
                            assignment.save()
                        
                        # Update stats
                        assignment.update_stats()
                    except Form.DoesNotExist:
                        continue
                
                return Response({
                    'message': 'Form assignments updated successfully',
                    'assigned_forms': len(form_ids)
                })
            except Exception as e:
                logger.error(f"Error updating form assignments: {e}")
                return Response({'error': str(e)}, status=500)

class AffiliateStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, affiliate_id):
        """Get affiliate statistics (Admin only)"""
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        
        try:
            affiliate = Affiliate.objects.get(id=affiliate_id)
            
            # Calculate comprehensive stats
            stats = {
                'affiliate_id': str(affiliate.id),
                'affiliate_code': affiliate.affiliate_code,
                'total_leads': affiliate.leads.count(),
                'total_conversions': affiliate.leads.filter(
                    status__in=['qualified', 'demo_completed', 'closed_won']
                ).count(),
                'assigned_forms': affiliate.assigned_forms.filter(is_active=True).count(),
                'active_assignments': affiliate.affiliateformassignment_set.filter(is_active=True).count()
            }
            
            return Response(stats)
        except Affiliate.DoesNotExist:
            return Response({'error': 'Affiliate not found'}, status=404)
        except Exception as e:
            logger.error(f"Error getting affiliate stats: {e}")
            return Response({'error': str(e)}, status=500)

class AffiliateLeadsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, affiliate_id):
        """Get affiliate leads (Admin only)"""
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        
        try:
            affiliate = Affiliate.objects.get(id=affiliate_id)
            leads = affiliate.leads.select_related('form').order_by('-created_at')[:20]
            
            from apps.leads.serializers import LeadSerializer
            return Response({
                'affiliate_id': str(affiliate.id),
                'affiliate_code': affiliate.affiliate_code,
                'leads': LeadSerializer(leads, many=True).data
            })
        except Affiliate.DoesNotExist:
            return Response({'error': 'Affiliate not found'}, status=404)
        except Exception as e:
            logger.error(f"Error getting affiliate leads: {e}")
            return Response({'error': str(e)}, status=500)

class FormAssignmentBulkView(APIView):
    """Bulk assign forms to multiple affiliates (Admin only)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        
        try:
            affiliate_ids = request.data.get('affiliate_ids', [])
            form_ids = request.data.get('form_ids', [])
            action = request.data.get('action', 'assign')  # 'assign' or 'unassign'
            
            results = []
            
            for affiliate_id in affiliate_ids:
                try:
                    affiliate = Affiliate.objects.get(id=affiliate_id)
                    assigned_count = 0
                    
                    for form_id in form_ids:
                        try:
                            form = Form.objects.get(id=form_id, is_active=True)
                            
                            if action == 'assign':
                                assignment, created = AffiliateFormAssignment.objects.get_or_create(
                                    affiliate=affiliate,
                                    form=form,
                                    defaults={
                                        'assigned_by': request.user,
                                        'is_active': True
                                    }
                                )
                                if not created:
                                    assignment.is_active = True
                                    assignment.save()
                                assigned_count += 1
                            
                            elif action == 'unassign':
                                AffiliateFormAssignment.objects.filter(
                                    affiliate=affiliate,
                                    form=form
                                ).update(is_active=False)
                                assigned_count += 1
                        
                        except Form.DoesNotExist:
                            continue
                    
                    results.append({
                        'affiliate_id': str(affiliate.id),
                        'affiliate_code': affiliate.affiliate_code,
                        'processed_forms': assigned_count
                    })
                
                except Affiliate.DoesNotExist:
                    results.append({
                        'affiliate_id': affiliate_id,
                        'error': 'Affiliate not found'
                    })
            
            return Response({
                'message': f'Bulk {action} completed',
                'results': results
            })
        
        except Exception as e:
            logger.error(f"Error in bulk assignment: {e}")
            return Response({'error': str(e)}, status=500)
