require "test_helper"

class OrderTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email_address: "test@example.com", password: "password123")
    @product = Product.create!(
      id: "test-product",
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: 100
    )
    @valid_attrs = {
      user: @user,
      total: 50.0,
      customer: { firstName: "Mario", lastName: "Rossi", email: "mario@example.com" },
      address: { street: "Via Roma 1", city: "Milano", zip: "20100" }
    }
  end

  # ---------------------------------------------------------------------------
  # Validazioni
  # ---------------------------------------------------------------------------

  # Verifica che un ordine con tutti i campi obbligatori sia valido.
  test "valid with user, total, customer and address" do
    order = Order.new(@valid_attrs)
    assert order.valid?
  end

  # Verifica che senza user l'ordine non sia valido (belongs_to obbligatorio).
  test "invalid without user" do
    order = Order.new(@valid_attrs.except(:user))
    assert_not order.valid?
  end

  # Verifica che senza total l'ordine non sia valido.
  test "invalid without total" do
    order = Order.new(@valid_attrs.except(:total))
    assert_not order.valid?
    assert_includes order.errors[:total], "can't be blank"
  end

  # Verifica che un total pari a 0 non sia accettato.
  test "invalid with zero total" do
    order = Order.new(@valid_attrs.merge(total: 0))
    assert_not order.valid?
    assert_includes order.errors[:total], "must be greater than 0"
  end

  # Verifica che un total negativo non sia accettato.
  test "invalid with negative total" do
    order = Order.new(@valid_attrs.merge(total: -10.0))
    assert_not order.valid?
    assert_includes order.errors[:total], "must be greater than 0"
  end

  # Verifica che senza customer l'ordine non sia valido.
  test "invalid without customer" do
    order = Order.new(@valid_attrs.except(:customer))
    assert_not order.valid?
    assert_includes order.errors[:customer], "can't be blank"
  end

  # Verifica che senza address l'ordine non sia valido.
  test "invalid without address" do
    order = Order.new(@valid_attrs.except(:address))
    assert_not order.valid?
    assert_includes order.errors[:address], "can't be blank"
  end

  # ---------------------------------------------------------------------------
  # Relazioni
  # ---------------------------------------------------------------------------

  # Verifica la relazione belongs_to con User.
  test "belongs to user" do
    order = Order.create!(@valid_attrs)
    assert_equal @user, order.user
  end

  # Verifica la relazione has_many con order_items.
  test "has many order_items" do
    order = Order.create!(@valid_attrs)
    item1 = OrderItem.create!(order: order, product: @product, quantity: 1, unit_price: 10.0)

    other_product = Product.create!(
      id: "other-product", title: "Other", price: 20.0, original_price: 25.0, stock: 5
    )
    item2 = OrderItem.create!(order: order, product: other_product, quantity: 2, unit_price: 20.0)

    assert_includes order.order_items, item1
    assert_includes order.order_items, item2
    assert_equal 2, order.order_items.count
  end

  # Verifica la relazione has_many through :products.
  test "has many products through order_items" do
    order = Order.create!(@valid_attrs)
    OrderItem.create!(order: order, product: @product, quantity: 1, unit_price: 10.0)

    assert_includes order.products, @product
  end

  # Verifica che la cancellazione dell'ordine elimini a cascata gli order_items.
  test "destroys associated order_items when order is destroyed" do
    order = Order.create!(@valid_attrs)
    OrderItem.create!(order: order, product: @product, quantity: 1, unit_price: 10.0)

    assert_difference "OrderItem.count", -1 do
      order.destroy
    end
  end

  # Verifica che accepts_nested_attributes_for permetta la creazione di order_items
  # tramite hash nidificato.
  test "accepts nested attributes for order_items" do
    order = Order.new(@valid_attrs.merge(
      order_items_attributes: [
        { product_id: @product.id, quantity: 2, unit_price: 10.0 }
      ]
    ))

    assert order.save
    assert_equal 1, order.order_items.count
  end

  # ---------------------------------------------------------------------------
  # Serializzazione JSON
  # ---------------------------------------------------------------------------

  # Verifica che as_json restituisca le chiavi camelCase attese.
  test "as_json returns expected camelCase keys" do
    order = Order.create!(@valid_attrs)
    json = order.as_json

    assert_equal order.id, json[:id]
    assert_equal @user.id, json[:userId]
    assert json.key?(:customer)
    assert json.key?(:address)
    assert json.key?(:total)
    assert json.key?(:createdAt)
    assert json.key?(:items)
  end

  # Verifica che total nel JSON sia un Float.
  test "as_json converts total to float" do
    order = Order.create!(@valid_attrs)
    assert_instance_of Float, order.as_json[:total]
  end

  # Verifica che gli items contengano la struttura attesa.
  test "as_json includes serialized order_items" do
    order = Order.create!(@valid_attrs)
    OrderItem.create!(order: order, product: @product, quantity: 2, unit_price: 10.0)

    items = order.as_json[:items]
    assert_equal 1, items.size

    item = items.first
    assert_equal @product.id, item[:productId]
    assert_equal 2, item[:quantity]
    assert_equal 10.0, item[:unitPrice]
    assert item.key?(:product)
  end

  # Verifica che createdAt sia formattato come ISO8601.
  test "as_json formats createdAt as ISO8601" do
    order = Order.create!(@valid_attrs)
    assert_match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, order.as_json[:createdAt])
  end
end
