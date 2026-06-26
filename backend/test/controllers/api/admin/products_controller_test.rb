require "test_helper"

class Api::Admin::ProductsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @admin = User.create!(
      email_address: "admin@example.com",
      password: "password123",
      role: "admin"
    )
    @customer = User.create!(
      email_address: "user@example.com",
      password: "password123",
      role: "customer"
    )
    @product = Product.create!(
      id: "test-product",
      title: "Test Product",
      description: "A test product",
      price: 10.0,
      original_price: 15.0,
      stock: 5,
      tags: ["electronics"]
    )
  end

  # ---------------------------------------------------------------------------
  # Autorizzazione (admin-only)
  # ---------------------------------------------------------------------------

  # Verifica che senza autenticazione index venga rifiutato con 401.
  test "index requires authentication" do
    get "/api/admin/products"
    assert_response :unauthorized
  end

  # Verifica che un customer non possa accedere a index (403 Forbidden).
  test "index returns 403 for non-admin users" do
    get "/api/admin/products", headers: auth_headers_for(@customer)
    assert_response :forbidden
    body = JSON.parse(response.body)
    assert_match(/admin/, body["error"])
  end

  # Verifica che un customer non possa creare prodotti.
  test "create returns 403 for non-admin users" do
    post "/api/admin/products",
         params: { product: { id: "x", title: "X", price: 1, original_price: 2, stock: 1 } },
         headers: auth_headers_for(@customer)
    assert_response :forbidden
  end

  # Verifica che un customer non possa modificare prodotti.
  test "update returns 403 for non-admin users" do
    patch "/api/admin/products/#{@product.id}",
          params: { product: { title: "Hacked" } },
          headers: auth_headers_for(@customer)
    assert_response :forbidden
  end

  # Verifica che un customer non possa eliminare prodotti.
  test "destroy returns 403 for non-admin users" do
    delete "/api/admin/products/#{@product.id}", headers: auth_headers_for(@customer)
    assert_response :forbidden
  end

  # ---------------------------------------------------------------------------
  # GET /api/admin/products
  # ---------------------------------------------------------------------------

  # Verifica che un admin possa ottenere la lista dei prodotti.
  test "index returns all products for admin" do
    Product.create!(id: "p2", title: "P2", price: 20, original_price: 30, stock: 5)

    get "/api/admin/products", headers: auth_headers_for(@admin)

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body.length
  end

  # Verifica che la lista sia ordinata per created_at desc.
  test "index returns products ordered by created_at descending" do
    older = Product.create!(id: "older", title: "Older", price: 1, original_price: 2, stock: 1, created_at: 2.days.ago)
    newer = Product.create!(id: "newer", title: "Newer", price: 1, original_price: 2, stock: 1, created_at: 1.day.ago)

    get "/api/admin/products", headers: auth_headers_for(@admin)

    body = JSON.parse(response.body)
    ids = body.map { |p| p["id"] }
    assert_operator ids.index("newer"), :<, ids.index("older")
  end

  # ---------------------------------------------------------------------------
  # POST /api/admin/products
  # ---------------------------------------------------------------------------

  # Verifica che un admin possa creare un prodotto con parametri validi.
  test "create creates a new product with valid params" do
    assert_difference "Product.count", 1 do
      post "/api/admin/products",
           params: {
             product: {
               id: "new-product",
               title: "New Product",
               description: "Description",
               price: 50.0,
               original_price: 75.0,
               stock: 100,
               tags: ["new"]
             }
           },
           headers: auth_headers_for(@admin)
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "new-product", body["id"]
    assert_equal "New Product", body["title"]
  end

  # Verifica che la creazione fallisca con 422 se mancano campi obbligatori.
  test "create returns 422 when title is missing" do
    assert_no_difference "Product.count" do
      post "/api/admin/products",
           params: { product: { id: "no-title", price: 10, original_price: 15, stock: 1 } },
           headers: auth_headers_for(@admin)
    end

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert body["errors"].any? { |e| e.include?("Title") }
  end

  # Verifica che la creazione fallisca con 422 se il prezzo è invalido.
  test "create returns 422 when price is zero or negative" do
    post "/api/admin/products",
         params: { product: { id: "bad", title: "Bad", price: 0, original_price: 15, stock: 1 } },
         headers: auth_headers_for(@admin)

    assert_response :unprocessable_entity
  end

  # Verifica che parametri non permessi vengano ignorati (strong parameters).
  test "create ignores non-permitted parameters" do
    post "/api/admin/products",
         params: {
           product: {
             id: "sp-test",
             title: "T",
             price: 10,
             original_price: 15,
             stock: 1,
             created_at: 1.year.ago
           }
         },
         headers: auth_headers_for(@admin)

    assert_response :created
    product = Product.find("sp-test")
    assert_in_delta Time.current.to_i, product.created_at.to_i, 60
  end

  # ---------------------------------------------------------------------------
  # PATCH /api/admin/products/:id
  # ---------------------------------------------------------------------------

  # Verifica che un admin possa aggiornare un prodotto esistente.
  test "update modifies an existing product" do
    patch "/api/admin/products/#{@product.id}",
          params: { product: { title: "Updated Title", price: 99.99 } },
          headers: auth_headers_for(@admin)

    assert_response :success
    @product.reload
    assert_equal "Updated Title", @product.title
    assert_equal 99.99, @product.price.to_f
  end

  # Verifica che update fallisca con 422 se i nuovi valori sono invalidi.
  test "update returns 422 with invalid params" do
    patch "/api/admin/products/#{@product.id}",
          params: { product: { price: -5 } },
          headers: auth_headers_for(@admin)

    assert_response :unprocessable_entity
    assert JSON.parse(response.body).key?("errors")
  end

  # Verifica che update restituisca 404 per un prodotto inesistente.
  test "update returns 404 when product does not exist" do
    patch "/api/admin/products/nonexistent",
          params: { product: { title: "X" } },
          headers: auth_headers_for(@admin)

    assert_response :not_found
    body = JSON.parse(response.body)
    assert_equal "Product not found", body["error"]
  end

  # Verifica che update permetta di aggiornare lo stock.
  test "update can change stock" do
    patch "/api/admin/products/#{@product.id}",
          params: { product: { stock: 999 } },
          headers: auth_headers_for(@admin)

    assert_response :success
    assert_equal 999, @product.reload.stock
  end

  # ---------------------------------------------------------------------------
  # DELETE /api/admin/products/:id
  # ---------------------------------------------------------------------------

  # Verifica che un admin possa eliminare un prodotto esistente.
  test "destroy removes the product and returns 204" do
    assert_difference "Product.count", -1 do
      delete "/api/admin/products/#{@product.id}", headers: auth_headers_for(@admin)
    end

    assert_response :no_content
  end

  # Verifica che destroy restituisca 404 per un prodotto inesistente.
  test "destroy returns 404 when product does not exist" do
    delete "/api/admin/products/nonexistent", headers: auth_headers_for(@admin)

    assert_response :not_found
    body = JSON.parse(response.body)
    assert_equal "Product not found", body["error"]
  end

  # Verifica che la cancellazione del prodotto rimuova anche gli order_items associati.
  test "destroy cascades to associated order_items" do
    order = Order.create!(user: @customer, total: 10.0, customer: { name: "T" }, address: { street: "S" })
    OrderItem.create!(order: order, product: @product, quantity: 1, unit_price: 10.0)

    assert_difference "OrderItem.count", -1 do
      delete "/api/admin/products/#{@product.id}", headers: auth_headers_for(@admin)
    end
  end
end
