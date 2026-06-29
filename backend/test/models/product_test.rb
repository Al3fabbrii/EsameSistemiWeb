require "test_helper"
require "bigdecimal"

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
      tags: [ "electronics", "sale" ],
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
      tags: [ "electronics", "sale" ],
      stock: 10
    )

    json = product.as_json

    assert_equal "Test Product", json[:title]
    assert_equal "A test product", json[:description]
    assert json[:sale]
    assert_equal "http://example.com/image.jpg", json[:thumbnail]
    assert_equal [ "electronics", "sale" ], json[:tags]
    assert_equal 10, json[:stock]
  end

  # ---------------------------------------------------------------------------
  # Property-based testing
  # ---------------------------------------------------------------------------

  # Invariante: ogni price > 0 supera la validazione del campo price,
  # ogni price <= 0 la fa fallire con il messaggio atteso.
  test "validazione price riflette sempre il confine zero (PBT)" do
    # price positivo → nessun errore su :price
    property_of {
      range(1, 1_000_000)
    }.check(50) do |cents|
      price = BigDecimal(cents) / 100
      p = Product.new(title: "T", price: price, original_price: 10, stock: 1)
      p.valid?
      assert_empty p.errors[:price], "price=#{price.to_s('F')} non dovrebbe generare errori su :price"
    end

    # price non positivo → errore "must be greater than 0"
    property_of {
      range(-1_000_000, 0)
    }.check(50) do |cents|
      price = BigDecimal(cents) / 100
      p = Product.new(title: "T", price: price, original_price: 10, stock: 1)
      assert_not p.valid?, "price=#{price.to_s('F')} dovrebbe essere invalido"
      assert_includes p.errors[:price], "must be greater than 0"
    end
  end

  # Roundtrip: per qualsiasi (price, original_price, stock) salvati, as_json
  # restituisce gli stessi valori (price/originalPrice come Float, stock intatto).
  test "as_json restituisce sempre i valori numerici salvati (PBT)" do
    property_of {
      [ range(1, 100_000), range(1, 100_000), range(0, 1000) ]
    }.check(50) do |price_cents, orig_cents, stock|
      price = BigDecimal(price_cents) / 100
      orig  = BigDecimal(orig_cents)  / 100
      p = Product.create!(
        id: "pbt-asjson-#{SecureRandom.hex(8)}",
        title: "T",
        price: price,
        original_price: orig,
        stock: stock
      )
      json = p.as_json
      assert_equal price.to_f, json[:price]
      assert_equal orig.to_f,  json[:originalPrice]
      assert_equal stock,      json[:stock]
    end
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
