# apps/users/apps.py
from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

# apps/users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'user_type', 'is_staff', 'date_joined')
    list_filter = ('user_type', 'is_staff', 'is_superuser')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('user_type', 'affiliate_id')}),
    )

# apps/users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
]

---

# apps/forms/apps.py
from django.apps import AppConfig

class FormsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.forms'

# apps/forms/admin.py
from django.contrib import admin
from .models import Form, FormField

class FormFieldInline(admin.TabularInline):
    model = FormField
    extra = 1

@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ('name', 'form_type', 'created_by', 'is_active', 'created_at')
    list_filter = ('form_type', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    inlines = [FormFieldInline]
    readonly_fields = ('id', 'embed_code', 'created_at', 'updated_at')

@admin.register(FormField)
class FormFieldAdmin(admin.ModelAdmin):
    list_display = ('form', 'label', 'field_type', 'is_required', 'order')
    list_filter = ('field_type', 'is_required')
    ordering = ('form', 'order')

# apps/forms/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'forms', views.FormViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('<uuid:form_id>/', views.EmbedFormView.as_view(), name='embed_form'),
    path('<uuid:form_id>/submit/', views.FormSubmissionView.as_view(), name='form_submit'),
    path('<uuid:form_id>/stats/', views.FormStatsView.as_view(), name='form_stats'),
]

---

# apps/leads/apps.py
from django.apps import AppConfig

class LeadsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.leads'

# apps/leads/admin.py
from django.contrib import admin
from .models import Lead, LeadNote

class LeadNoteInline(admin.TabularInline):
    model = LeadNote
    extra = 0
    readonly_fields = ('created_at',)

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'form', 'affiliate_code', 'status', 'created_at')
    list_filter = ('status', 'form', 'affiliate', 'created_at')
    search_fields = ('email', 'name', 'form__name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [LeadNoteInline]

@admin.register(LeadNote)
class LeadNoteAdmin(admin.ModelAdmin):
    list_display = ('lead', 'user', 'created_at')
    list_filter = ('created_at', 'user')

# apps/leads/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'leads', views.LeadViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('export/', views.ExportLeadsView.as_view(), name='export_leads'),
    path('stats/', views.LeadStatsView.as_view(), name='lead_stats'),
]

---

# apps/affiliates/apps.py
from django.apps import AppConfig

class AffiliatesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.affiliates'

# apps/affiliates/admin.py
from django.contrib import admin
from .models import Affiliate

@admin.register(Affiliate)
class AffiliateAdmin(admin.ModelAdmin):
    list_display = ('user', 'affiliate_code', 'company_name', 'total_leads', 'conversion_rate', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__username', 'affiliate_code', 'company_name')
    readonly_fields = ('id', 'total_leads', 'total_conversions', 'created_at', 'updated_at')

# apps/affiliates/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'affiliates', views.AffiliateViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('<uuid:affiliate_id>/stats/', views.AffiliateStatsView.as_view(), name='affiliate_stats'),
    path('<uuid:affiliate_id>/leads/', views.AffiliateLeadsView.as_view(), name='affiliate_leads'),
]

---

# apps/core/apps.py
from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'

# apps/core/admin.py
from django.contrib import admin
from .models import Setting, Analytics

@admin.register(Setting)
class SettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_at')
    search_fields = ('key', 'description')

@admin.register(Analytics)
class AnalyticsAdmin(admin.ModelAdmin):
    list_display = ('form', 'date', 'views', 'submissions', 'conversion_rate')
    list_filter = ('date', 'form')
    date_hierarchy = 'date'

# apps/core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('analytics/', views.AnalyticsView.as_view(), name='analytics'),
    path('settings/', views.SettingsView.as_view(), name='settings'),
]
