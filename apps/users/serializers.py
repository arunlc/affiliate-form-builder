# apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'user_type', 'affiliate_id', 'date_joined')
        read_only_fields = ('id', 'date_joined')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            attrs['user'] = user
        return attrs

# apps/users/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import login, logout
from .models import User
from .serializers import UserSerializer, LoginSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)

---

# apps/forms/serializers.py
from rest_framework import serializers
from .models import Form, FormField

class FormFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormField
        fields = '__all__'

class FormSerializer(serializers.ModelSerializer):
    fields = FormFieldSerializer(many=True, read_only=True)
    
    class Meta:
        model = Form
        fields = '__all__'
        read_only_fields = ('id', 'embed_code', 'created_by', 'created_at', 'updated_at')

# apps/forms/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import Form
from .serializers import FormSerializer

class FormViewSet(viewsets.ModelViewSet):
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.user_type == 'admin':
            return Form.objects.all()
        return Form.objects.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class EmbedFormView(APIView):
    """Render embeddable form"""
    
    def get(self, request, form_id):
        form = get_object_or_404(Form, id=form_id, is_active=True)
        context = {
            'form': form,
            'affiliate_id': request.GET.get('affiliate'),
            'utm_params': {
                'utm_source': request.GET.get('utm_source', ''),
                'utm_medium': request.GET.get('utm_medium', ''),
                'utm_campaign': request.GET.get('utm_campaign', ''),
                'utm_term': request.GET.get('utm_term', ''),
                'utm_content': request.GET.get('utm_content', ''),
            }
        }
        return render(request, 'embed/form.html', context)

@method_decorator(csrf_exempt, name='dispatch')
class FormSubmissionView(APIView):
    """Handle form submissions"""
    
    def post(self, request, form_id):
        form = get_object_or_404(Form, id=form_id, is_active=True)
        
        # Extract form data
        form_data = request.data.get('form_data', {})
        affiliate_id = request.data.get('affiliate_id')
        utm_params = request.data.get('utm_params', {})
        
        # Create lead (will implement in leads app)
        # TODO: Create lead with form submission data
        
        return JsonResponse({'status': 'success', 'message': 'Form submitted successfully'})

class FormStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, form_id):
        form = get_object_or_404(Form, id=form_id)
        # TODO: Return form statistics
        return Response({'form_id': form_id, 'stats': 'placeholder'})

---

# apps/leads/serializers.py
from rest_framework import serializers
from .models import Lead, LeadNote

class LeadNoteSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = LeadNote
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class LeadSerializer(serializers.ModelSerializer):
    lead_notes = LeadNoteSerializer(many=True, read_only=True)
    affiliate_code = serializers.CharField(read_only=True)
    form_name = serializers.CharField(source='form.name', read_only=True)
    
    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

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

---

# apps/affiliates/serializers.py
from rest_framework import serializers
from .models import Affiliate

class AffiliateSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Affiliate
        fields = '__all__'
        read_only_fields = ('id', 'total_leads', 'total_conversions', 'created_at', 'updated_at')

# apps/affiliates/views.py
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Affiliate
from .serializers import AffiliateSerializer

class AffiliateViewSet(viewsets.ModelViewSet):
    queryset = Affiliate.objects.all()
    serializer_class = AffiliateSerializer
    permission_classes = [IsAuthenticated]

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

---

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
