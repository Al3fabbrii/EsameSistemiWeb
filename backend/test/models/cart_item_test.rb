require "test_helper"
require "bigdecimal"

class CartItemTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email_address: "test@example.com", password: "password123")
    @cart = Cart.create!(user: @user)
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

  # Verifica che un cart_item con cart, product, quantity e unit_price validi sia valido.
  test "valid with cart, product, quantity and unit_price" do
    item = CartItem.new(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)
    assert item.valid?
  end

  # Verifica che senza quantity il cart_item non sia valido.
  test "invalid without quantity" do
    item = CartItem.new(cart: @cart, product: @product, unit_price: 10.0)
    assert_not item.valid?
    assert_includes item.errors[:quantity], "can't be blank"
  end

  # Verifica che una quantity pari a 0 non sia accettata.
  test "invalid with zero quantity" do
    item = CartItem.new(cart: @cart, product: @product, quantity: 0, unit_price: 10.0)
    assert_not item.valid?
    assert_includes item.errors[:quantity], "must be greater than 0"
  end

  # Verifica che una quantity negativa non sia accettata.
  test "invalid with negative quantity" do
    item = CartItem.new(cart: @cart, product: @product, quantity: -1, unit_price: 10.0)
    assert_not item.valid?
    assert_includes item.errors[:quantity], "must be greater than 0"
  end

  # Verifica che una quantity non intera (decimale) non sia accettata.
  test "invalid with non-integer quantity" do
    item = CartItem.new(cart: @cart, product: @product, quantity: 1.5, unit_price: 10.0)
    assert_not item.valid?
    assert_includes item.errors[:quantity], "must be an integer"
  end

  # Verifica che senza unit_price il cart_item non sia valido.
  test "invalid without unit_price" do
    item = CartItem.new(cart: @cart, product: @product, quantity: 1)
    assert_not item.valid?
    assert_includes item.errors[:unit_price], "can't be blank"
  end

  # Verifica che un unit_price pari a 0 non sia accettato.
  test "invalid with zero unit_price" do
    item = CartItem.new(cart: @cart, product: @product, quantity: 1, unit_price: 0)
    assert_not item.valid?
    assert_includes item.errors[:unit_price], "must be greater than 0"
  end

  # Verifica che un unit_price negativo non sia accettato.
  test "invalid with negative unit_price" do
    item = CartItem.new(cart: @cart, product: @product, quantity: 1, unit_price: -5.0)
    assert_not item.valid?
    assert_includes item.errors[:unit_price], "must be greater than 0"
  end

  # Verifica che lo stesso prodotto non possa essere presente due volte nello stesso carrello.
  test "invalid with duplicate product in same cart" do
    CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)
    duplicate = CartItem.new(cart: @cart, product: @product, quantity: 2, unit_price: 10.0)

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:item_id], "has already been taken"
  end

  # Verifica che lo stesso prodotto possa stare in carrelli diversi.
  test "valid with same product in different carts" do
    other_user = User.create!(email_address: "other@example.com", password: "password123")
    other_cart = Cart.create!(user: other_user)

    CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)
    item = CartItem.new(cart: other_cart, product: @product, quantity: 1, unit_price: 10.0)

    assert item.valid?
  end

  # ---------------------------------------------------------------------------
  # Relazioni
  # ---------------------------------------------------------------------------

  # Verifica la relazione belongs_to con Cart.
  test "belongs to cart" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)
    assert_equal @cart, item.cart
  end

  # Verifica la relazione belongs_to con Product (foreign_key item_id).
  test "belongs to product via item_id" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)
    assert_equal @product, item.product
    assert_equal @product.id, item.item_id
  end

  # ---------------------------------------------------------------------------
  # Metodo subtotal
  # ---------------------------------------------------------------------------

  # Verifica che subtotal restituisca quantity * unit_price.
  test "subtotal returns quantity times unit_price" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 3, unit_price: 10.0)
    assert_equal 30.0, item.subtotal
  end

  # Verifica che subtotal usi l'unit_price salvato e non il prezzo corrente del prodotto.
  test "subtotal uses stored unit_price, not current product price" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 2, unit_price: 10.0)
    @product.update!(price: 100.0)

    assert_equal 20.0, item.subtotal
  end

  # ---------------------------------------------------------------------------
  # Serializzazione JSON
  # ---------------------------------------------------------------------------

  # Verifica che as_json contenga tutte le chiavi camelCase attese.
  test "as_json returns expected camelCase keys" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 2, unit_price: 10.0)
    json = item.as_json

    assert_equal item.id, json[:id]
    assert_equal @cart.id, json[:cartId]
    assert_equal @product.id, json[:productId]
    assert_equal 2, json[:quantity]
    assert_equal 10.0, json[:unitPrice]
    assert_equal 20.0, json[:subtotal]
    assert json.key?(:product)
  end

  # Verifica che il prodotto serializzato in as_json sia nel formato Product#as_json.
  test "as_json embeds nested product representation" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)
    product_json = item.as_json[:product]

    assert_equal @product.id, product_json[:id]
    assert_equal "Test Product", product_json[:title]
    assert product_json.key?(:originalPrice)
  end

  # Verifica che unit_price e subtotal nel JSON siano Float.
  test "as_json converts unit_price and subtotal to floats" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 2, unit_price: 10.0)
    json = item.as_json

    assert_instance_of Float, json[:unitPrice]
    assert_instance_of Float, json[:subtotal]
  end

  # ---------------------------------------------------------------------------
  # Property-based testing (subtotal)
  #
  # subtotal è una pura funzione (quantity * unit_price), perfetta per il PBT:
  # verifichiamo invarianti universali invece di casi singoli. I prezzi sono
  # generati come centesimi interi e convertiti in BigDecimal per evitare
  # imprecisioni del Float (la colonna unit_price è :decimal in DB).
  # ---------------------------------------------------------------------------

  test "subtotal coincide sempre con quantity * unit_price (PBT)" do
    property_of {
      [ range(1, 1000), range(1, 100_000) ]
    }.check(100) do |quantity, price_cents|
      unit_price = BigDecimal(price_cents) / 100
      item = CartItem.new(quantity: quantity, unit_price: unit_price)
      assert_equal quantity * unit_price, item.subtotal,
        "subtotal dovrebbe essere quantity (#{quantity}) * unit_price (#{unit_price.to_s('F')})"
    end
  end

  test "subtotal scala linearmente con la quantità (PBT)" do
    property_of {
      [ range(1, 500), range(1, 100_000) ]
    }.check(100) do |quantity, price_cents|
      unit_price = BigDecimal(price_cents) / 100
      single = CartItem.new(quantity: quantity, unit_price: unit_price).subtotal
      double = CartItem.new(quantity: quantity * 2, unit_price: unit_price).subtotal
      assert_equal single * 2, double,
        "raddoppiando la quantità il subtotale dovrebbe raddoppiare"
    end
  end
end
