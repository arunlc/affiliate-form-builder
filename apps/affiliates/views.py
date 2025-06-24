# apps/affiliates/views.py - Enhanced with Password Management
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Affiliate, AffiliateFormAssignment
from .serializers import (
    AffiliateSerializer, AffiliateCreateSerializer, AffiliateUpdateSerializer
)
from apps.leads.models import Lead
from apps.forms.models import Form
import logging

logger = logging.getLogger(__name__)

class AffiliateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Affiliate.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AffiliateCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AffiliateUpdateSerializer
        return AffiliateSerializer
    
    def get_queryset(self):
        # Only admins can manage affiliates
        if self.request.user.user_type == 'admin':
            return Affiliate.objects.select_related('user').prefetch_related(
                'affiliateformassignment_set__form', 'leads'
            ).order_by('-created_at')
        return Affiliate.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Create affiliate with enhanced user handling and password management"""
        try:
            logger.info(f"Creating affiliate with data: {request.data}")
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            affiliate = serializer.save()
            
            # Return the affiliate with the standard serializer
            response_serializer = AffiliateSerializer(affiliate)
            
            return Response({
                'data': response_serializer.data,
                'message': 'Affiliate created successfully!'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating affiliate: {str(e)}")
            return Response({
                'error': 'Failed to create affiliate',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        """Update affiliate with enhanced user handling"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            
            affiliate = serializer.save()
            
            # Return updated affiliate data
            response_serializer = AffiliateSerializer(affiliate)
            
            return Response({
                'data': response_serializer.data,
                'message': 'Affiliate updated successfully!'
            })
            
        except Exception as e:
            logger.error(f"Error updating affiliate: {str(e)}")
            return Response({
                'error': 'Failed to update affiliate',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset password for an affiliate (Admin only)"""
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            affiliate = self.get_object()
            password = request.data.get('password')
            send_email = request.data.get('send_email', False)
            
            if not password:
                # Generate a secure random password
                import secrets
                import string
                alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
                password = ''.join(secrets.choice(alphabet) for _ in range(12))
            
            # Update user password
            affiliate.user.set_password(password)
            affiliate.user.save()
            
            # Invalidate existing tokens
            from rest_framework.authtoken.models import Token
            Token.objects.filter(user=affiliate.user).delete()
            
            # Send email if requested and user has email
            if send_email and affiliate.user.email:
                try:
                    from django.core.mail import send_mail
                    from django.conf import settings
                    
                    subject = 'Your Password Has Been Reset'
                    message = f"""
                    Hello {affiliate.user.username},
                    
                    Your password has been reset by an administrator.
                    
                    New Password: {password}
                    
                    Please login and change your password for security.
                    
                    Login URL: {settings.FRONTEND_URL}/login
                    
                    Best regards,
                    The Team
                    """
                    
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [affiliate.user.email],
                        fail_silently=False,
                    )
                    
                    return Response({
                        'message': 'Password reset successfully and email sent',
                        'password': password if not send_email else None
                    })
                except Exception as e:
                    logger.error(f"Failed to send password reset email: {e}")
                    return Response({
                        'message': 'Password reset successfully but email failed to send',
                        'password': password,
                        'email_error': str(e)
                    })
            
            return Response({
                'message': 'Password reset successfully',
                'password': password
            })
            
        except Exception as e:
            logger.error(f"Error resetting affiliate password: {e}")
            return Response({
                'error': 'Failed to reset password',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def send_credentials(self, request, pk=None):
        """Send login credentials to affiliate via email (Admin only)"""
        if request.user.user_type != 'admin':
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            affiliate = self.get_object()
            
            if not affiliate.user.email:
                return Response({
                    'error': 'Affiliate has no email address'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate new password
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            new_password = ''.join(secrets.choice(alphabet) for _ in range(12))
            
            # Update password
            affiliate.user.set_password(new_password)
            affiliate.user.save()
            
            # Send email
            from django.core.mail import send_mail
            from django.conf import settings
            
            subject = 'Your Affiliate Account Credentials'
            message = f"""
            Hello {affiliate.user.username},
            
            Here are your updated login credentials:
            
            Username: {affiliate.user.username}
            Password: {new_password}
            Affiliate Code: {affiliate.affiliate_code}
            
            Login URL: {settings.FRONTEND_URL}/login
            
            Please change your password after logging in for security.
            
            Best regards,
            The Team
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [affiliate.user.email],
                fail_silently=False,
            )
            
            return Response({
                'message': f'Credentials sent to {affiliate.user.email}'
            })
            
        except Exception as e:
            logger.error(f"Error sending credentials: {e}")
            return Response({
                'error': 'Failed to send credentials',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
