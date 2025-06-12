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
