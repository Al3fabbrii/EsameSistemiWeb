require "test_helper"

class ProductTest < ActiveSupport::TestCase
  # Test delle validazioni - title
  test "valid with title, price, original_price and stock" do
    product = Product.new(
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )
    assert product.valid?
  end

  test "invalid without title" do
    product = Product.new(
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )
    assert_not product.valid?
    assert_includes product.errors[:title], "can't be blank"
  end

  # Test delle validazioni - price
  test "invalid without price" do
    product = Product.new(
      title: "Test Product",
      original_price: 15.0,
      stock: 5
    )
    assert_not product.valid?
    assert_includes product.errors[:price], "can't be blank"
  end

  test "invalid with zero price" do
    product = Product.new(
      title: "Test Product",
      price: 0,
      original_price: 15.0,
      stock: 5
    )
    assert_not product.valid?
    assert_includes product.errors[:price], "must be greater than 0"
  end

  test "invalid with negative price" do
    product = Product.new(
      title: "Test Product",
      price: -5.0,
      original_price: 15.0,
      stock: 5
    )
    assert_not product.valid?
    assert_includes product.errors[:price], "must be greater than 0"
  end

  # Test delle validazioni - original_price
  test "invalid without original_price" do
    product = Product.new(
      title: "Test Product",
      price: 10.0,
      stock: 5
    )
    assert_not product.valid?
    assert_includes product.errors[:original_price], "can't be blank"
  end

  test "invalid with zero original_price" do
    product = Product.new(
      title: "Test Product",
      price: 10.0,
      original_price: 0,
      stock: 5
    )
    assert_not product.valid?
    assert_includes product.errors[:original_price], "must be greater than 0"
  end

  test "invalid with negative original_price" do
    product = Product.new(
      title: "Test Product",
      price: 10.0,
      original_price: -5.0,
      stock: 5
    )
    assert_not product.valid?
    assert_includes product.errors[:original_price], "must be greater than 0"
  end

  # Test delle validazioni - stock
  test "valid with zero stock" do
    product = Product.new(
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: 0
    )
    assert product.valid?
  end

  test "invalid without stock" do
    product = Product.new(
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: nil
    )
    assert_not product.valid?
    assert_includes product.errors[:stock], "can't be blank"
  end

  test "invalid with negative stock" do
    product = Product.new(
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: -1
    )
    assert_not product.valid?
    assert_includes product.errors[:stock], "must be greater than or equal to 0"
  end

  # Test del metodo as_json
  test "as_json returns hash with camelCase keys" do
    product = Product.create!(
      id: "test-product-1",
      title: "Test Product",
      description: "A test product",
      price: 10.99,
      original_price: 15.99,
      sale: true,
      thumbnail: "http://example.com/image.jpg",
      tags: ["electronics", "sale"],
      stock: 10
    )

    json = product.as_json

    assert json.key?(:id)
    assert json.key?(:title)
    assert json.key?(:description)
    assert json.key?(:price)
    assert json.key?(:originalPrice)
    assert json.key?(:sale)
    assert json.key?(:thumbnail)
    assert json.key?(:tags)
    assert json.key?(:stock)
    assert json.key?(:createdAt)
  end

  test "as_json converts prices to floats" do
    product = Product.create!(
      id: "test-product-2",
      title: "Test Product",
      price: 10.99,
      original_price: 15.99,
      stock: 5
    )

    json = product.as_json

    assert_equal 10.99, json[:price]
    assert_equal 15.99, json[:originalPrice]
    assert_instance_of Float, json[:price]
    assert_instance_of Float, json[:originalPrice]
  end

  test "as_json formats created_at as ISO8601" do
    product = Product.create!(
      id: "test-product-3",
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )

    json = product.as_json

    assert_match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, json[:createdAt])
  end

  test "as_json includes all product attributes" do
    product = Product.create!(
      id: "test-product-4",
      title: "Test Product",
      description: "A test product",
      price: 10.99,
      original_price: 15.99,
      sale: true,
      thumbnail: "http://example.com/image.jpg",
      tags: ["electronics", "sale"],
      stock: 10
    )

    json = product.as_json

    assert_equal "Test Product", json[:title]
    assert_equal "A test product", json[:description]
    assert json[:sale]
    assert_equal "http://example.com/image.jpg", json[:thumbnail]
    assert_equal ["electronics", "sale"], json[:tags]
    assert_equal 10, json[:stock]
  end

  # Test delle relazioni con order_items
  test "destroys associated order_items when product is destroyed" do
    product = Product.create!(
      id: "test-product-5",
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )

    user = User.create!(email_address: "test@example.com", password: "password123")
    order = Order.create!(
      user: user,
      total: 10.0,
      customer: { name: "Test User", email: "test@example.com" },
      address: { street: "123 Test St", city: "Test City" }
    )
    OrderItem.create!(order: order, product: product, quantity: 1, unit_price: 10.0)

    assert_difference "OrderItem.count", -1 do
      product.destroy
    end
  end
end
