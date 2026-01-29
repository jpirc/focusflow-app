#!/bin/bash

# Dopatika Rename Script
# This script renames all FocusFlow references to Dopatika
# Run this on the rename-to-dopatika branch

echo "🎯 Starting Dopatika rename..."

# 1. Update comments and documentation
echo "📝 Updating comments and docs..."
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/rename-to-dopatika.sh" \
  -exec sed -i '' 's/FocusFlow/Dopatika/g' {} +

# 2. Update lowercase focusflow (package names, paths, etc)
echo "📦 Updating package references..."
find . -type f \( -name "*.json" -o -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/package-lock.json" \
  -exec sed -i '' 's/focusflow/dopatika/g' {} +

# 3. Update function/class names
echo "🔧 Updating code references..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/FocusFlowApp/DopatikaApp/g' {} +

find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -exec sed -i '' 's/FocusFlowIntelligence/DopatikaIntelligence/g' {} +

echo "✅ Rename complete!"
echo ""
echo "⚠️  IMPORTANT: You still need to manually:"
echo "1. Run 'npm install' to update package-lock.json"
echo "2. Test localStorage migration in hooks/useLocalStorageMigration.ts"
echo "3. Update .env files if needed"
echo "4. Test the app thoroughly"
echo ""
echo "📝 Next steps:"
echo "1. npm install"
echo "2. npm run dev"
echo "3. Test all features"
echo "4. Commit changes"
