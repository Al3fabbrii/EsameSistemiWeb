require "test_helper"

class Api::CartItemsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email_address: "user@example.com", password: "password123")
    @product = Product.create!(
      id: "test-product",
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )
    @cart = @user.current_cart
  end

  # ---------------------------------------------------------------------------
  # POST /api/cart/items
  # ---------------------------------------------------------------------------

  # Verifica che senza autenticazione la creazione venga rifiutata con 401.
  test "create requires authentication" do
    post "/api/cart/items", params: { product_id: @product.id, quantity: 1 }
    assert_response :unauthorized
  end

  # Verifica che con product_id e quantity validi un item venga aggiunto al carrello.
  test "create adds a new item to the cart" do
    assert_difference "CartItem.count", 1 do
      post "/api/cart/items",
           params: { product_id: @product.id, quantity: 2 },
           headers: auth_headers_for(@user)
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 1, body["items"].size
    assert_equal 2, body["items"].first["quantity"]
  end

  # Verifica che la quantity di default sia 1 se non specificata.
  test "create defaults quantity to 1 when not specified" do
    post "/api/cart/items",
         params: { product_id: @product.id },
         headers: auth_headers_for(@user)

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 1, body["items"].first["quantity"]
  end

  # Verifica che l'unit_price salvato sia il prezzo corrente del prodotto.
  test "create freezes unit_price to current product price" do
    post "/api/cart/items",
         params: { product_id: @product.id, quantity: 1 },
         headers: auth_headers_for(@user)

    item = CartItem.last
    assert_equal 10.0, item.unit_price
  end

  # Verifica che aggiungere lo stesso prodotto due volte incrementi la quantity esistente
  # invece di creare un secondo cart_item.
  test "create increments quantity when product already in cart" do
    CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)

    assert_no_difference "CartItem.count" do
      post "/api/cart/items",
           params: { product_id: @product.id, quantity: 2 },
           headers: auth_headers_for(@user)
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 1, body["items"].size
    assert_equal 3, body["items"].first["quantity"]
  end

  # Verifica che la richiesta fallisca con 404 se il prodotto non esiste.
  test "create returns 404 when product does not exist" do
    post "/api/cart/items",
         params: { product_id: "nonexistent", quantity: 1 },
         headers: auth_headers_for(@user)

    assert_response :not_found
    body = JSON.parse(response.body)
    assert_equal "Product not found", body["error"]
  end

  # Verifica che la richiesta fallisca con 422 se lo stock è insufficiente.
  test "create returns 422 when stock is insufficient" do
    post "/api/cart/items",
         params: { product_id: @product.id, quantity: 999 },
         headers: auth_headers_for(@user)

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_match(/Stock insufficiente/, body["error"])
  end

  # Verifica che incrementando la quantity oltre lo stock disponibile la richiesta fallisca.
  test "create returns 422 when total quantity would exceed stock" do
    CartItem.create!(cart: @cart, product: @product, quantity: 4, unit_price: 10.0)

    post "/api/cart/items",
         params: { product_id: @product.id, quantity: 2 },  # 4 + 2 = 6, stock = 5
         headers: auth_headers_for(@user)

    assert_response :unprocessable_entity
  end

  # ---------------------------------------------------------------------------
  # PATCH /api/cart/items/:id
  # ---------------------------------------------------------------------------

  # Verifica che senza autenticazione l'update venga rifiutato con 401.
  test "update requires authentication" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)
    patch "/api/cart/items/#{item.id}", params: { quantity: 3 }
    assert_response :unauthorized
  end

  # Verifica che la quantity di un item esistente possa essere aggiornata.
  test "update changes the quantity of an existing cart_item" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)

    patch "/api/cart/items/#{item.id}",
          params: { quantity: 3 },
          headers: auth_headers_for(@user)

    assert_response :success
    assert_equal 3, item.reload.quantity
  end

  # Verifica che update fallisca con 422 se la nuova quantity supera lo stock.
  test "update returns 422 when new quantity exceeds stock" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)

    patch "/api/cart/items/#{item.id}",
          params: { quantity: 999 },
          headers: auth_headers_for(@user)

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_match(/Stock insufficiente/, body["error"])
  end

  # Verifica che update fallisca con 404 se l'item non appartiene al carrello dell'utente.
  test "update returns 404 when cart_item does not exist" do
    patch "/api/cart/items/99999",
          params: { quantity: 1 },
          headers: auth_headers_for(@user)

    assert_response :not_found
  end

  # Verifica che un utente non possa aggiornare item appartenenti al carrello di un altro.
  test "update cannot modify another user cart_item" do
    other_user = User.create!(email_address: "other@example.com", password: "password123")
    other_cart = Cart.create!(user: other_user)
    other_item = CartItem.create!(cart: other_cart, product: @product, quantity: 1, unit_price: 10.0)

    patch "/api/cart/items/#{other_item.id}",
          params: { quantity: 5 },
          headers: auth_headers_for(@user)

    assert_response :not_found
    assert_equal 1, other_item.reload.quantity
  end

  # ---------------------------------------------------------------------------
  # DELETE /api/cart/items/:id
  # ---------------------------------------------------------------------------

  # Verifica che senza autenticazione il delete venga rifiutato con 401.
  test "destroy requires authentication" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)
    delete "/api/cart/items/#{item.id}"
    assert_response :unauthorized
  end

  # Verifica che un cart_item esistente possa essere eliminato.
  test "destroy removes the cart_item" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)

    assert_difference "CartItem.count", -1 do
      delete "/api/cart/items/#{item.id}", headers: auth_headers_for(@user)
    end

    assert_response :success
  end

  # Verifica che la risposta dopo l'eliminazione contenga il carrello aggiornato.
  test "destroy returns the updated cart" do
    item = CartItem.create!(cart: @cart, product: @product, quantity: 1, unit_price: 10.0)

    delete "/api/cart/items/#{item.id}", headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_empty body["items"]
    assert_equal 0.0, body["total"]
  end

  # Verifica che destroy fallisca con 404 per item inesistente.
  test "destroy returns 404 when cart_item does not exist" do
    delete "/api/cart/items/99999", headers: auth_headers_for(@user)
    assert_response :not_found
  end

  # Verifica che un utente non possa eliminare item appartenenti al carrello di un altro.
  test "destroy cannot remove another user cart_item" do
    other_user = User.create!(email_address: "other@example.com", password: "password123")
    other_cart = Cart.create!(user: other_user)
    other_item = CartItem.create!(cart: other_cart, product: @product, quantity: 1, unit_price: 10.0)

    assert_no_difference "CartItem.count" do
      delete "/api/cart/items/#{other_item.id}", headers: auth_headers_for(@user)
    end

    assert_response :not_found
  end
end
