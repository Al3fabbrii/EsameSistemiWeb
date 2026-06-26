require "test_helper"

class CartTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email_address: "test@example.com", password: "password123")
    @product1 = Product.create!(
      id: "test-product-1",
      title: "Product 1",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )
    @product2 = Product.create!(
      id: "test-product-2",
      title: "Product 2",
      price: 20.0,
      original_price: 25.0,
      stock: 3
    )
  end

  # ---------------------------------------------------------------------------
  # Validazioni e relazioni base
  # ---------------------------------------------------------------------------

  # Verifica che un carrello associato a un utente sia valido.
  test "valid with user" do
    cart = Cart.new(user: @user)
    assert cart.valid?
  end

  # Verifica che un carrello senza utente non sia valido (belongs_to obbligatorio).
  test "invalid without user" do
    cart = Cart.new
    assert_not cart.valid?
  end

  # Verifica la relazione belongs_to con User.
  test "belongs to user" do
    cart = Cart.create!(user: @user)
    assert_equal @user, cart.user
  end

  # Verifica che un carrello possa contenere più cart_items.
  test "has many cart_items" do
    cart = Cart.create!(user: @user)
    item1 = CartItem.create!(cart: cart, product: @product1, quantity: 2, unit_price: 10.0)
    item2 = CartItem.create!(cart: cart, product: @product2, quantity: 1, unit_price: 20.0)

    assert_includes cart.cart_items, item1
    assert_includes cart.cart_items, item2
    assert_equal 2, cart.cart_items.count
  end

  # Verifica che la relazione has_many through :products funzioni correttamente.
  test "has many products through cart_items" do
    cart = Cart.create!(user: @user)
    CartItem.create!(cart: cart, product: @product1, quantity: 1, unit_price: 10.0)
    CartItem.create!(cart: cart, product: @product2, quantity: 1, unit_price: 20.0)

    assert_includes cart.products, @product1
    assert_includes cart.products, @product2
  end

  # Verifica che la cancellazione del carrello elimini a cascata i cart_items.
  test "destroys associated cart_items when cart is destroyed" do
    cart = Cart.create!(user: @user)
    CartItem.create!(cart: cart, product: @product1, quantity: 1, unit_price: 10.0)

    assert_difference "CartItem.count", -1 do
      cart.destroy
    end
  end

  # ---------------------------------------------------------------------------
  # Metodo total
  # ---------------------------------------------------------------------------

  # Verifica che total restituisca 0 per un carrello vuoto.
  test "total returns 0 for empty cart" do
    cart = Cart.create!(user: @user)
    assert_equal 0, cart.total
  end

  # Verifica che total calcoli correttamente la somma quantity * unit_price.
  test "total sums quantity times unit_price across items" do
    cart = Cart.create!(user: @user)
    CartItem.create!(cart: cart, product: @product1, quantity: 2, unit_price: 10.0)  # 20
    CartItem.create!(cart: cart, product: @product2, quantity: 3, unit_price: 20.0)  # 60

    assert_equal 80.0, cart.total
  end

  # Verifica che total usi l'unit_price congelato al momento dell'aggiunta
  # e non il prezzo corrente del prodotto (anche se cambia dopo).
  test "total uses frozen unit_price even if product price changes later" do
    cart = Cart.create!(user: @user)
    CartItem.create!(cart: cart, product: @product1, quantity: 1, unit_price: 10.0)

    @product1.update!(price: 999.99)
    assert_equal 10.0, cart.total
  end

  # ---------------------------------------------------------------------------
  # Serializzazione JSON
  # ---------------------------------------------------------------------------

  # Verifica che as_json restituisca le chiavi attese in camelCase.
  test "as_json returns hash with expected camelCase keys" do
    cart = Cart.create!(user: @user)
    json = cart.as_json

    assert_equal cart.id, json[:id]
    assert_equal @user.id, json[:userId]
    assert json.key?(:items)
    assert json.key?(:total)
    assert json.key?(:createdAt)
    assert json.key?(:updatedAt)
  end

  # Verifica che il total nel JSON sia un Float.
  test "as_json converts total to float" do
    cart = Cart.create!(user: @user)
    CartItem.create!(cart: cart, product: @product1, quantity: 1, unit_price: 10.0)

    assert_instance_of Float, cart.as_json[:total]
  end

  # Verifica che il JSON includa la rappresentazione di tutti gli items.
  test "as_json includes all cart_items serialized" do
    cart = Cart.create!(user: @user)
    CartItem.create!(cart: cart, product: @product1, quantity: 2, unit_price: 10.0)
    CartItem.create!(cart: cart, product: @product2, quantity: 1, unit_price: 20.0)

    assert_equal 2, cart.as_json[:items].size
  end

  # Verifica che createdAt e updatedAt siano formattati come ISO8601.
  test "as_json formats timestamps as ISO8601" do
    cart = Cart.create!(user: @user)
    json = cart.as_json

    assert_match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, json[:createdAt])
    assert_match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, json[:updatedAt])
  end
end
