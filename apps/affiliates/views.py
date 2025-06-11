# apps/affiliates/views.py
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Affiliate
from .serializers import AffiliateSerializer

class AffiliateViewSet(viewsets.ModelViewSet):
    serializer_class = AffiliateSerializer
    permission_classes = [IsAuthenticated]
    queryset = Affiliate.objects.all()  # Add this line for DRF router

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
