# apps/affiliates/views.py - FIXED VERSION
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
                'affiliateformassignment_set__form', 'leads'
            ).order_by('-created_at')
        return Affiliate.objects.none()
    
    def perform_create(self, serializer):
        """Create affiliate with proper user handling"""
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Get data from request
            user_name = self.request.data.get('user_name')
            email = self.request.data.get('email', '')
            affiliate_code = self.request.data.get('affiliate_code')
            
            logger.info(f"Creating affiliate: {user_name}, {email}, {affiliate_code}")
            
            # Validate required fields
            if not user_name:
                raise ValueError("Username is required")
            if not affiliate_code:
                raise ValueError("Affiliate code is required")
            
            # Check if user already exists
            try:
                user = User.objects.get(username=user_name)
                logger.info(f"User {user_name} already exists, updating...")
                # Update existing user
                if email:
                    user.email = email
                user.user_type = 'affiliate'
                user.affiliate_id = affiliate_code
                user.save()
            except User.DoesNotExist:
                logger.info(f"Creating new user: {user_name}")
                # Create new user
                user = User.objects.create_user(
                    username=user_name,
                    email=email,
                    password='changeme123',  # Default password
                    user_type='affiliate',
                    affiliate_id=affiliate_code
                )
            
            # Check if affiliate already exists for this user
            if Affiliate.objects.filter(user=user).exists():
                raise ValueError(f"Affiliate already exists for user {user_name}")
            
            # Save the affiliate with the user
            serializer.save(user=user)
            logger.info(f"Affiliate created successfully: {affiliate_code}")
            
        except Exception as e:
            logger.error(f"Error creating affiliate: {str(e)}")
            raise
    
    def create(self, request, *args, **kwargs):
        """Override create to handle validation errors properly"""
        try:
            # Log the incoming data
            logger.info(f"Affiliate creation request data: {request.data}")
            
            # Validate required fields before serialization
            user_name = request.data.get('user_name')
            affiliate_code = request.data.get('affiliate_code')
            
            if not user_name:
                return Response(
                    {'error': 'Username is required', 'field': 'user_name'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not affiliate_code:
                return Response(
                    {'error': 'Affiliate code is required', 'field': 'affiliate_code'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if affiliate code already exists
            if Affiliate.objects.filter(affiliate_code=affiliate_code).exists():
                return Response(
                    {'error': f'Affiliate code "{affiliate_code}" already exists', 'field': 'affiliate_code'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create serializer with data (excluding user fields)
            affiliate_data = {
                'affiliate_code': affiliate_code,
                'company_name': request.data.get('company_name', ''),
                'website': request.data.get('website', ''),
                'is_active': request.data.get('is_active', True)
            }
            
            serializer = self.get_serializer(data=affiliate_data)
            serializer.is_valid(raise_exception=True)
            
            # Perform create
            self.perform_create(serializer)
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in affiliate creation: {str(e)}")
            return Response(
                {'error': 'An error occurred while creating the affiliate'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Override update to handle partial updates properly"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            # Prepare data for update (exclude user fields from direct update)
            affiliate_data = {
                'affiliate_code': request.data.get('affiliate_code', instance.affiliate_code),
                'company_name': request.data.get('company_name', instance.company_name),
                'website': request.data.get('website', instance.website),
                'is_active': request.data.get('is_active', instance.is_active)
            }
            
            # Update user fields separately if provided
            user_name = request.data.get('user_name')
            email = request.data.get('email')
            
            if user_name and user_name != instance.user.username:
                # Check if new username is available
                from django.contrib.auth import get_user_model
                User = get_user_model()
                if User.objects.filter(username=user_name).exclude(id=instance.user.id).exists():
                    return Response(
                        {'error': f'Username "{user_name}" is already taken', 'field': 'user_name'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                instance.user.username = user_name
            
            if email is not None:
                instance.user.email = email
            
            instance.user.save()
            
            # Update affiliate
            serializer = self.get_serializer(instance, data=affiliate_data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)

            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}

            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error updating affiliate: {str(e)}")
            return Response(
                {'error': 'An error occurred while updating the affiliate'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
            
            # Revenue estimation
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
            
            # Form performance
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
                'form_performance': form_performance,
                'join_date': affiliate.created_at,
                'is_active': affiliate.is_active,
                'assigned_forms_count': affiliate.affiliateformassignment_set.filter(is_active=True).count()
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
            leads = queryset.order_by('-created_at')[:50]
            
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
            
            # Get available forms not assigned
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
            
            stats = {
                'affiliate_id': str(affiliate.id),
                'affiliate_code': affiliate.affiliate_code,
                'total_leads': affiliate.leads.count(),
                'total_conversions': affiliate.leads.filter(
                    status__in=['qualified', 'demo_completed', 'closed_won']
                ).count(),
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
            action = request.data.get('action', 'assign')
            
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
