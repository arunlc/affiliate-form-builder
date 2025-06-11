# apps/leads/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from .models import Lead
from .serializers import LeadSerializer
import pandas as pd

class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'admin':
            return Lead.objects.all()
        elif user.user_type == 'affiliate':
            return Lead.objects.filter(affiliate__user=user)
        elif user.user_type == 'operations':
            return Lead.objects.all()
        return Lead.objects.none()

class ExportLeadsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get filtered leads based on user permissions
        leads = Lead.objects.all()  # TODO: Apply user filtering
        
        # Convert to DataFrame
        data = []
        for lead in leads:
            data.append({
                'Email': lead.email,
                'Name': lead.name,
                'Phone': lead.phone,
                'Form': lead.form.name,
                'Status': lead.status,
                'Affiliate': lead.affiliate_code,
                'UTM Source': lead.utm_source,
                'Created': lead.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            })
        
        df = pd.DataFrame(data)
        
        # Create Excel response
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="leads_export.xlsx"'
        df.to_excel(response, index=False, engine='openpyxl')
        
        return response

class LeadStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # TODO: Return lead statistics
        return Response({'total_leads': 0, 'conversions': 0})
