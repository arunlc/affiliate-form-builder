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
    queryset = User.objects.all()  # This is already correct
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
