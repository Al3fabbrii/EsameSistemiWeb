require "test_helper"

class Api::CartsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email_address: "user@example.com", password: "password123")
    @product = Product.create!(
      id: "test-product",
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: 100
    )
  end

  # ---------------------------------------------------------------------------
  # GET /api/cart
  # ---------------------------------------------------------------------------

  # Verifica che senza autenticazione la richiesta venga rifiutata con 401.
  test "show requires authentication" do
    get "/api/cart"
    assert_response :unauthorized
  end

  # Verifica che un utente autenticato ottenga il proprio carrello.
  test "show returns the current user cart" do
    get "/api/cart", headers: auth_headers_for(@user)

    assert_response :success
    body = JSON.parse(response.body)
    assert body.key?("id")
    assert_equal @user.id, body["userId"]
    assert_equal [], body["items"]
    assert_equal 0.0, body["total"]
  end

  # Verifica che venga creato un nuovo carrello se l'utente non ne ha (lazy creation).
  test "show lazily creates a cart for users who do not have one" do
    assert_equal 0, @user.carts.count

    assert_difference "Cart.count", 1 do
      get "/api/cart", headers: auth_headers_for(@user)
    end

    assert_response :success
  end

  # Verifica che, se l'utente ha già un carrello, non ne venga creato uno nuovo.
  test "show returns existing cart without creating a new one" do
    cart = Cart.create!(user: @user)

    assert_no_difference "Cart.count" do
      get "/api/cart", headers: auth_headers_for(@user)
    end

    body = JSON.parse(response.body)
    assert_equal cart.id, body["id"]
  end

  # Verifica che il carrello restituito contenga gli items con la struttura attesa.
  test "show includes cart items with product details" do
    cart = @user.current_cart
    CartItem.create!(cart: cart, product: @product, quantity: 2, unit_price: 10.0)

    get "/api/cart", headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_equal 1, body["items"].size
    item = body["items"].first
    assert_equal 2, item["quantity"]
    assert_equal 10.0, item["unitPrice"]
    assert_equal 20.0, item["subtotal"]
    assert_equal "Test Product", item["product"]["title"]
  end

  # Verifica che il total nel JSON sia coerente con la somma dei subtotali.
  test "show returns total matching sum of subtotals" do
    cart = @user.current_cart
    CartItem.create!(cart: cart, product: @product, quantity: 2, unit_price: 10.0)
    other = Product.create!(id: "p2", title: "P2", price: 5.0, original_price: 7.0, stock: 10)
    CartItem.create!(cart: cart, product: other, quantity: 3, unit_price: 5.0)

    get "/api/cart", headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_equal 35.0, body["total"]
  end

  # Verifica che ogni utente veda solo il proprio carrello (isolamento tra utenti).
  test "show is scoped to the authenticated user only" do
    other_user = User.create!(email_address: "other@example.com", password: "password123")
    other_cart = Cart.create!(user: other_user)
    CartItem.create!(cart: other_cart, product: @product, quantity: 5, unit_price: 10.0)

    get "/api/cart", headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_not_equal other_cart.id, body["id"]
    assert_empty body["items"]
  end
end
