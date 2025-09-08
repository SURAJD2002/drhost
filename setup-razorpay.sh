#!/bin/bash

echo "🚀 Setting up Razorpay Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm version: $(npm --version)"

# Step 1: Backend Setup
echo ""
print_status "Setting up Backend..."

cd backend

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating backend .env file..."
    cp env.example .env
    print_warning "Please update backend/.env with your Razorpay keys:"
    print_warning "RAZORPAY_KEY_ID=rzp_test_your_key_id_here"
    print_warning "RAZORPAY_KEY_SECRET=your_secret_key_here"
else
    print_status "Backend .env file already exists"
fi

cd ..

# Step 2: Frontend Setup
echo ""
print_status "Setting up Frontend..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating frontend .env file..."
    cp frontend.env.example .env
    print_warning "Please update .env with your configuration:"
    print_warning "REACT_APP_BACKEND_URL=http://localhost:5000"
    print_warning "REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key_id_here"
else
    print_status "Frontend .env file already exists"
fi

# Step 3: Installation Complete
echo ""
print_status "Razorpay Integration Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update backend/.env with your Razorpay keys"
echo "2. Update .env with your frontend configuration"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: npm start"
echo ""
echo "🔗 Backend will run on: http://localhost:5000"
echo "🔗 Frontend will run on: http://localhost:3000"
echo ""
echo "📚 See RAZORPAY_BACKEND_INTEGRATION_README.md for detailed instructions"
echo ""
print_status "Happy coding! 🎉" 