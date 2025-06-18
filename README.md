# Affiliate Form Builder SaaS

A comprehensive SaaS platform for creating embeddable lead capture forms with affiliate tracking, UTM attribution, and powerful dashboards.

## 🚀 Features

- **Embeddable Forms**: Create beautiful forms that work on any website
- **Affiliate Tracking**: Automatic attribution and performance tracking
- **UTM Attribution**: Complete marketing campaign tracking
- **Multi-Dashboard**: Separate views for Admin, Affiliates, and Operations
- **Excel Export**: Export leads with filtering options
- **Real-time Analytics**: Track form performance and conversions
- **Modern UI**: Built with React and Tailwind CSS

## 🛠️ Tech Stack

- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Database**: PostgreSQL (SQLite for development)
- **Deployment**: Render.com
- **Styling**: Tailwind CSS
- **State Management**: React Query

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- Git
- PostgreSQL (for production)

## 🔧 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/affiliate-form-builder.git
cd affiliate-form-builder
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your local settings

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start Django development server
python manage.py runserver
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin

## 🚢 Deployment to Render

### 1. Prepare for Deployment

1. **Create GitHub Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/affiliate-form-builder.git
   git push -u origin main
   ```

2. **Update Environment Variables**: Make sure your `.env` file is not committed and create production environment variables on Render.

### 2. Deploy to Render

1. **Connect GitHub**: Link your GitHub repository to Render
2. **Configure Service**: Render will automatically detect the `render.yaml` file
3. **Set Environment Variables**:
   - `SECRET_KEY`: Generate a secure key
   - `DATABASE_URL`: Will be auto-provided by Render PostgreSQL
   - `ALLOWED_HOSTS`: Your render domain
   - `DEBUG`: False

4. **Deploy**: Render will automatically build and deploy your application

### 3. Post-Deployment Setup

```bash
# SSH into your Render instance or use the web shell
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/register/` - Register new user

### Forms API
- `GET /api/forms/` - List all forms
- `POST /api/forms/` - Create new form
- `GET /api/forms/{id}/` - Get form details
- `PUT /api/forms/{id}/` - Update form
- `DELETE /api/forms/{id}/` - Delete form

### Leads API
- `GET /api/leads/` - List leads (filtered by user role)
- `POST /api/leads/` - Create new lead (form submission)
- `GET /api/leads/{id}/` - Get lead details
- `PUT /api/leads/{id}/` - Update lead status/notes

### Affiliates API
- `GET /api/affiliates/` - List affiliates
- `POST /api/affiliates/` - Create new affiliate
- `GET /api/affiliates/{id}/stats/` - Get affiliate statistics

## 🔗 Embedding Forms

### iframe Method
```html
<iframe 
  src="https://yourapp.com/embed/{form_id}?affiliate=xyz123&utm_source=website" 
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

### JavaScript Method
```html
<script src="https://yourapp.com/js/form-embed.js" data-form-id="{form_id}"></script>
```

## 📊 Analytics & Tracking

### UTM Parameters
- `utm_source`: Traffic source
- `utm_medium`: Marketing medium
- `utm_campaign`: Campaign name
- `utm_term`: Keywords
- `utm_content`: Content variant

### Affiliate Tracking
- Add `?affiliate=code` to any form URL
- Automatic attribution to affiliate account
- Real-time performance tracking

## 🔐 User Roles

### Admin
- Create and manage forms
- View all leads and analytics
- Manage affiliates and users
- System configuration

### Affiliate
- View their attributed leads
- Access performance dashboard
- Generate tracking links

### Operations
- Update lead statuses
- Add notes to leads
- Export lead data
- Manage lead workflow

## 📁 Project Structure

```
affiliate-form-builder/
├── backend/               # Django configuration
├── apps/                  # Django applications
│   ├── core/             # Core functionality
│   ├── users/            # User management
│   ├── forms/            # Form builder
│   ├── leads/            # Lead management
│   └── affiliates/       # Affiliate tracking
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── services/     # API services
└── templates/            # Django templates
```

## 🧪 Testing

```bash
# Backend tests
python manage.py test

# Frontend tests
cd frontend
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review API endpoints in Django admin

## 🔄 Development Workflow

1. **Feature Development**: Create feature branches from `main`
2. **Testing**: Test locally before pushing
3. **Deployment**: Push to `main` for automatic Render deployment
4. **Monitoring**: Check Render logs for any deployment issues

---

🚀 Deploy trigger - React build fix applied on June 18, 2025 -  2:35 PM
