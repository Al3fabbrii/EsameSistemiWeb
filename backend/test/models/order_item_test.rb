require "test_helper"

class OrderItemTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email_address: "test@example.com", password: "password123")
    @order = Order.create!(
      user: @user,
      total: 50.0,
      customer: { name: "Test" },
      address: { street: "Via Roma" }
    )
    @product = Product.create!(
      id: "test-product",
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: 100
    )
  end

  # ---------------------------------------------------------------------------
  # Validazioni
  # ---------------------------------------------------------------------------

  # Verifica che un order_item con tutti i campi obbligatori sia valido.
  test "valid with order, product, quantity and unit_price" do
    item = OrderItem.new(order: @order, product: @product, quantity: 1, unit_price: 10.0)
    assert item.valid?
  end

  # Verifica che il default DB della quantity sia 1 quando non viene specificata.
  # (Lo schema definisce 'quantity' con default: 1, null: false.)
  test "defaults quantity to 1 when not specified" do
    item = OrderItem.new(order: @order, product: @product, unit_price: 10.0)
    assert item.valid?
    assert_equal 1, item.quantity
  end

  # Verifica che impostando esplicitamente quantity a nil l'item non sia valido.
  test "invalid when quantity is explicitly nil" do
    item = OrderItem.new(order: @order, product: @product, quantity: nil, unit_price: 10.0)
    assert_not item.valid?
    assert_includes item.errors[:quantity], "can't be blank"
  end

  # Verifica che una quantity pari a 0 non sia accettata.
  test "invalid with zero quantity" do
    item = OrderItem.new(order: @order, product: @product, quantity: 0, unit_price: 10.0)
    assert_not item.valid?
    assert_includes item.errors[:quantity], "must be greater than 0"
  end

  # Verifica che una quantity decimale non sia accettata.
  test "invalid with non-integer quantity" do
    item = OrderItem.new(order: @order, product: @product, quantity: 1.5, unit_price: 10.0)
    assert_not item.valid?
    assert_includes item.errors[:quantity], "must be an integer"
  end

  # Verifica che senza unit_price non sia valido.
  test "invalid without unit_price" do
    item = OrderItem.new(order: @order, product: @product, quantity: 1)
    assert_not item.valid?
    assert_includes item.errors[:unit_price], "can't be blank"
  end

  # Verifica che un unit_price pari a 0 non sia accettato.
  test "invalid with zero unit_price" do
    item = OrderItem.new(order: @order, product: @product, quantity: 1, unit_price: 0)
    assert_not item.valid?
    assert_includes item.errors[:unit_price], "must be greater than 0"
  end

  # ---------------------------------------------------------------------------
  # Relazioni
  # ---------------------------------------------------------------------------

  # Verifica la relazione belongs_to con Order.
  test "belongs to order" do
    item = OrderItem.create!(order: @order, product: @product, quantity: 1, unit_price: 10.0)
    assert_equal @order, item.order
  end

  # Verifica la relazione belongs_to con Product.
  test "belongs to product" do
    item = OrderItem.create!(order: @order, product: @product, quantity: 1, unit_price: 10.0)
    assert_equal @product, item.product
  end

  # ---------------------------------------------------------------------------
  # Serializzazione JSON
  # ---------------------------------------------------------------------------

  # Verifica che as_json restituisca le chiavi camelCase attese.
  test "as_json returns expected camelCase keys" do
    item = OrderItem.create!(order: @order, product: @product, quantity: 3, unit_price: 10.0)
    json = item.as_json

    assert_equal item.id, json[:id]
    assert_equal @order.id, json[:orderId]
    assert_equal @product.id, json[:productId]
    assert_equal 3, json[:quantity]
    assert_equal 10.0, json[:unitPrice]
    assert json.key?(:product)
  end

  # Verifica che il prodotto nidificato sia nel formato Product#as_json.
  test "as_json embeds nested product representation" do
    item = OrderItem.create!(order: @order, product: @product, quantity: 1, unit_price: 10.0)
    product_json = item.as_json[:product]

    assert_equal @product.id, product_json[:id]
    assert_equal "Test Product", product_json[:title]
  end

  # Verifica che unit_price nel JSON sia un Float.
  test "as_json converts unit_price to float" do
    item = OrderItem.create!(order: @order, product: @product, quantity: 1, unit_price: 10.0)
    assert_instance_of Float, item.as_json[:unitPrice]
  end
end
