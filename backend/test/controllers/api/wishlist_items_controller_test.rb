require "test_helper"

class Api::WishlistItemsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email_address: "user@example.com", password: "password123")
    @product = Product.create!(
      id: "test-product",
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )
    @wishlist = @user.current_wishlist
  end

  # ---------------------------------------------------------------------------
  # POST /api/wishlist/items
  # ---------------------------------------------------------------------------

  # Verifica che senza autenticazione la creazione venga rifiutata con 401.
  test "create requires authentication" do
    post "/api/wishlist/items", params: { product_id: @product.id }
    assert_response :unauthorized
  end

  # Verifica che un prodotto venga aggiunto alla wishlist con 201.
  test "create adds a new item to the wishlist" do
    assert_difference "WishlistItem.count", 1 do
      post "/api/wishlist/items",
           params: { product_id: @product.id },
           headers: auth_headers_for(@user)
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 1, body["items"].size
    assert_equal @product.id, body["items"].first["productId"]
  end

  # Verifica che aggiungere lo stesso prodotto due volte non duplichi l'item
  # e restituisca status 200 (e non 201).
  test "create is idempotent: does not duplicate existing item" do
    WishlistItem.create!(wishlist: @wishlist, product: @product)

    assert_no_difference "WishlistItem.count" do
      post "/api/wishlist/items",
           params: { product_id: @product.id },
           headers: auth_headers_for(@user)
    end

    assert_response :ok
  end

  # Verifica che la richiesta fallisca con 404 se il prodotto non esiste.
  test "create returns 404 when product does not exist" do
    post "/api/wishlist/items",
         params: { product_id: "nonexistent" },
         headers: auth_headers_for(@user)

    assert_response :not_found
    body = JSON.parse(response.body)
    assert_equal "Product not found", body["error"]
  end

  # ---------------------------------------------------------------------------
  # DELETE /api/wishlist/items/:id
  # ---------------------------------------------------------------------------

  # Verifica che senza autenticazione il delete venga rifiutato con 401.
  test "destroy requires authentication" do
    item = WishlistItem.create!(wishlist: @wishlist, product: @product)
    delete "/api/wishlist/items/#{item.id}"
    assert_response :unauthorized
  end

  # Verifica che un item della wishlist possa essere eliminato.
  test "destroy removes the wishlist item" do
    item = WishlistItem.create!(wishlist: @wishlist, product: @product)

    assert_difference "WishlistItem.count", -1 do
      delete "/api/wishlist/items/#{item.id}", headers: auth_headers_for(@user)
    end

    assert_response :success
  end

  # Verifica che la risposta contenga la wishlist aggiornata.
  test "destroy returns the updated wishlist" do
    item = WishlistItem.create!(wishlist: @wishlist, product: @product)

    delete "/api/wishlist/items/#{item.id}", headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_empty body["items"]
  end

  # Verifica che destroy fallisca con 404 per item inesistente.
  test "destroy returns 404 when wishlist item does not exist" do
    delete "/api/wishlist/items/99999", headers: auth_headers_for(@user)
    assert_response :not_found
  end

  # Verifica che un utente non possa eliminare item appartenenti alla wishlist di un altro.
  test "destroy cannot remove another user wishlist item" do
    other_user = User.create!(email_address: "other@example.com", password: "password123")
    other_wishlist = Wishlist.create!(user: other_user)
    other_item = WishlistItem.create!(wishlist: other_wishlist, product: @product)

    assert_no_difference "WishlistItem.count" do
      delete "/api/wishlist/items/#{other_item.id}", headers: auth_headers_for(@user)
    end

    assert_response :not_found
  end

  # ---------------------------------------------------------------------------
  # Property-based testing
  # ---------------------------------------------------------------------------

  # Invariante di idempotenza HTTP: POST /api/wishlist/items con lo stesso
  # product_id eseguito N volte (N ≥ 2) lascia comunque la wishlist con
  # esattamente 1 item. Verifica che il backend non duplichi e che la prima
  # invocazione restituisca 201 e le successive 200.
  test "POST /api/wishlist/items è idempotente per N invocazioni ripetute (PBT)" do
    property_of {
      range(2, 8)
    }.check(15) do |n|
      @wishlist.wishlist_items.destroy_all

      n.times do |i|
        post "/api/wishlist/items",
             params: { product_id: @product.id },
             headers: auth_headers_for(@user)
        assert_includes [ 200, 201 ], response.status,
          "invocazione #{i + 1} dovrebbe rispondere 200 o 201, non #{response.status}"
      end

      assert_equal 1, @wishlist.wishlist_items.count,
        "dopo #{n} POST dovrebbe esserci esattamente 1 item nella wishlist"
    end
  end
end
