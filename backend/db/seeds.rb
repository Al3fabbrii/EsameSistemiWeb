# This file should ensure the existence of records required to run the application in every
# environment (production, development, test). The code here should be idempotent so that
# it can be executed at any point in every environment.
#
# Load with:
#   bin/rails db:seed                          (development)
#   RAILS_ENV=test bin/rails db:seed           (test, for E2E runs)

require 'json'

puts "🌱 Seeding database (#{Rails.env})..."

# ---------------------------------------------------------------------------
# Reset transactional data so each seed run starts from a clean state.
# Products and users below are then re-created idempotently.
# ---------------------------------------------------------------------------
puts "\nResetting transactional data..."
OrderItem.destroy_all
Order.destroy_all
CartItem.destroy_all
Cart.destroy_all
WishlistItem.destroy_all
Wishlist.destroy_all
Product.destroy_all

# ---------------------------------------------------------------------------
# Products: import from the mock API json bundled with the frontend.
# ---------------------------------------------------------------------------
mock_data_path = Rails.root.join('..', 'frontend', 'shop-mock-api', 'db.json')

if File.exist?(mock_data_path)
  mock_data = JSON.parse(File.read(mock_data_path))
  puts "\nImporting #{mock_data['products'].size} products from mock API..."

  mock_data['products'].each do |product|
    Product.create!(
      id: product['id'],
      title: product['title'],
      description: product['description'],
      price: product['price'],
      original_price: product['originalPrice'],
      sale: product['sale'],
      thumbnail: product['thumbnail'],
      tags: product['tags'],
      stock: rand(10..100), # randomic stock between 10 and 100
      created_at: product['createdAt'],
      updated_at: product['createdAt']
    )
  end

  puts "✅ Imported #{Product.count} products"
else
  puts "⚠️  Mock data file not found at #{mock_data_path}"
  puts "   Skipping product import."
end

# ---------------------------------------------------------------------------
# Test users (customer + admin) — used by the Playwright E2E suite.
# Credentials are intentionally weak and hard-coded: they are TEST accounts.
# ---------------------------------------------------------------------------
puts "\nCreating test users..."

User.find_or_create_by!(email_address: 'user@example.com') do |user|
  user.password = 'password123'
  user.password_confirmation = 'password123'
  user.role = 'customer'
end

User.find_or_create_by!(email_address: 'admin@example.com') do |user|
  user.password = 'admin123'
  user.password_confirmation = 'admin123'
  user.role = 'admin'
end

puts "✅ #{User.count} users present"
puts "   - Customer: user@example.com / password123"
puts "   - Admin:    admin@example.com / admin123"

puts "\n🎉 Seeding completed!"
