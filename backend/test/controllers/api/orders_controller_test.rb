require "test_helper"

class Api::OrdersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email_address: "user@example.com", password: "password123")
    @product1 = Product.create!(
      id: "prod-1", title: "Laptop", price: 1000.0,
      original_price: 1200.0, stock: 10
    )
    @product2 = Product.create!(
      id: "prod-2", title: "Mouse", price: 25.0,
      original_price: 30.0, stock: 50
    )
    @valid_order_params = {
      order: {
        total: 1050.0,
        customer: { firstName: "Mario", lastName: "Rossi", email: "mario@example.com" },
        address: { street: "Via Roma 1", city: "Milano", zip: "20100" },
        items: [
          { id: "prod-1", quantity: 1 },
          { id: "prod-2", quantity: 2 }
        ]
      }
    }
  end

  # ---------------------------------------------------------------------------
  # GET /api/orders
  # ---------------------------------------------------------------------------

  # Verifica che senza autenticazione la richiesta venga rifiutata con 401.
  test "index requires authentication" do
    get "/api/orders"
    assert_response :unauthorized
  end

  # Verifica che un utente autenticato veda i propri ordini.
  test "index returns user's own orders" do
    o1 = Order.create!(user: @user, total: 10.0, customer: { name: "T" }, address: { street: "S" })
    o2 = Order.create!(user: @user, total: 20.0, customer: { name: "T" }, address: { street: "S" })

    get "/api/orders", headers: auth_headers_for(@user)

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body.length
    ids = body.map { |o| o["id"] }
    assert_includes ids, o1.id
    assert_includes ids, o2.id
  end

  # Verifica che un utente NON veda gli ordini di altri utenti.
  test "index does not include orders of other users" do
    other_user = User.create!(email_address: "other@example.com", password: "password123")
    Order.create!(user: other_user, total: 99.0, customer: { name: "T" }, address: { street: "S" })

    get "/api/orders", headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_empty body
  end

  # Verifica che gli ordini siano ordinati per data discendente di default.
  test "index orders by created_at descending by default" do
    older = Order.create!(user: @user, total: 10.0, customer: { name: "T" }, address: { street: "S" }, created_at: 2.days.ago)
    newer = Order.create!(user: @user, total: 20.0, customer: { name: "T" }, address: { street: "S" }, created_at: 1.day.ago)

    get "/api/orders", headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_equal newer.id, body.first["id"]
    assert_equal older.id, body.last["id"]
  end

  # Verifica il filtro date_from: solo ordini >= alla data passata.
  test "index filters by date_from" do
    Order.create!(user: @user, total: 10.0, customer: { name: "T" }, address: { street: "S" }, created_at: 3.days.ago)
    recent = Order.create!(user: @user, total: 20.0, customer: { name: "T" }, address: { street: "S" }, created_at: 1.hour.ago)

    get "/api/orders",
        params: { date_from: 1.day.ago.iso8601 },
        headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_equal 1, body.length
    assert_equal recent.id, body.first["id"]
  end

  # Verifica il filtro date_to: solo ordini <= alla data passata.
  test "index filters by date_to" do
    old_order = Order.create!(user: @user, total: 10.0, customer: { name: "T" }, address: { street: "S" }, created_at: 3.days.ago)
    Order.create!(user: @user, total: 20.0, customer: { name: "T" }, address: { street: "S" }, created_at: 1.hour.ago)

    get "/api/orders",
        params: { date_to: 1.day.ago.iso8601 },
        headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_equal 1, body.length
    assert_equal old_order.id, body.first["id"]
  end

  # Verifica che date invalide vengano ignorate silenziosamente.
  test "index ignores invalid date filters" do
    Order.create!(user: @user, total: 10.0, customer: { name: "T" }, address: { street: "S" })

    get "/api/orders",
        params: { date_from: "not-a-date" },
        headers: auth_headers_for(@user)

    assert_response :success
    assert_equal 1, JSON.parse(response.body).length
  end

  # Verifica il filtro total_min.
  test "index filters by total_min" do
    Order.create!(user: @user, total: 10.0, customer: { name: "T" }, address: { street: "S" })
    big = Order.create!(user: @user, total: 100.0, customer: { name: "T" }, address: { street: "S" })

    get "/api/orders",
        params: { total_min: 50 },
        headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_equal 1, body.length
    assert_equal big.id, body.first["id"]
  end

  # Verifica il filtro total_max.
  test "index filters by total_max" do
    small = Order.create!(user: @user, total: 10.0, customer: { name: "T" }, address: { street: "S" })
    Order.create!(user: @user, total: 100.0, customer: { name: "T" }, address: { street: "S" })

    get "/api/orders",
        params: { total_max: 50 },
        headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_equal 1, body.length
    assert_equal small.id, body.first["id"]
  end

  # Verifica l'ordinamento total_asc.
  test "index sorts by total ascending" do
    Order.create!(user: @user, total: 50.0, customer: { name: "T" }, address: { street: "S" })
    Order.create!(user: @user, total: 10.0, customer: { name: "T" }, address: { street: "S" })
    Order.create!(user: @user, total: 100.0, customer: { name: "T" }, address: { street: "S" })

    get "/api/orders",
        params: { sort: "total_asc" },
        headers: auth_headers_for(@user)

    totals = JSON.parse(response.body).map { |o| o["total"] }
    assert_equal totals.sort, totals
  end

  # Verifica l'ordinamento total_desc.
  test "index sorts by total descending" do
    Order.create!(user: @user, total: 50.0, customer: { name: "T" }, address: { street: "S" })
    Order.create!(user: @user, total: 10.0, customer: { name: "T" }, address: { street: "S" })
    Order.create!(user: @user, total: 100.0, customer: { name: "T" }, address: { street: "S" })

    get "/api/orders",
        params: { sort: "total_desc" },
        headers: auth_headers_for(@user)

    totals = JSON.parse(response.body).map { |o| o["total"] }
    assert_equal totals.sort.reverse, totals
  end

  # Verifica l'ordinamento date_asc esplicito.
  test "index sorts by date ascending when sort=date_asc" do
    older = Order.create!(user: @user, total: 10.0, customer: { name: "T" }, address: { street: "S" }, created_at: 2.days.ago)
    newer = Order.create!(user: @user, total: 20.0, customer: { name: "T" }, address: { street: "S" }, created_at: 1.day.ago)

    get "/api/orders",
        params: { sort: "date_asc" },
        headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_equal older.id, body.first["id"]
    assert_equal newer.id, body.last["id"]
  end

  # ---------------------------------------------------------------------------
  # POST /api/orders
  # ---------------------------------------------------------------------------

  # Verifica che senza autenticazione la creazione venga rifiutata con 401.
  test "create requires authentication" do
    post "/api/orders", params: @valid_order_params
    assert_response :unauthorized
  end

  # Verifica che con parametri validi l'ordine venga creato con status 201.
  test "create creates a new order with valid params" do
    assert_difference "Order.count", 1 do
      post "/api/orders",
           params: @valid_order_params,
           headers: auth_headers_for(@user)
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal @user.id, body["userId"]
    assert_equal 1050.0, body["total"]
  end

  # Verifica che vengano creati gli order_items corrispondenti.
  test "create creates order_items for each product in items" do
    assert_difference "OrderItem.count", 2 do
      post "/api/orders",
           params: @valid_order_params,
           headers: auth_headers_for(@user)
    end
  end

  # Verifica che lo stock dei prodotti venga decrementato dopo l'ordine.
  test "create decrements product stock by ordered quantity" do
    post "/api/orders",
         params: @valid_order_params,
         headers: auth_headers_for(@user)

    assert_equal 9, @product1.reload.stock   # 10 - 1
    assert_equal 48, @product2.reload.stock  # 50 - 2
  end

  # Verifica che il carrello dell'utente venga svuotato dopo l'ordine.
  test "create empties the user's cart after successful order" do
    cart = @user.current_cart
    CartItem.create!(cart: cart, product: @product1, quantity: 1, unit_price: 1000.0)
    assert_equal 1, cart.cart_items.count

    post "/api/orders",
         params: @valid_order_params,
         headers: auth_headers_for(@user)

    assert_empty cart.reload.cart_items
  end

  # Verifica che la creazione fallisca con 422 se lo stock di un prodotto è insufficiente.
  test "create returns 422 when stock is insufficient" do
    @product1.update!(stock: 0)

    assert_no_difference "Order.count" do
      post "/api/orders",
           params: @valid_order_params,
           headers: auth_headers_for(@user)
    end

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_match(/Stock insufficiente/, body["error"])
  end

  # Verifica che se uno dei prodotti non esiste la richiesta fallisca con 422.
  test "create returns 422 when one of the products does not exist" do
    bad_params = @valid_order_params.deep_dup
    bad_params[:order][:items] = [ { id: "nonexistent", quantity: 1 } ]

    post "/api/orders",
         params: bad_params,
         headers: auth_headers_for(@user)

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_match(/non trovato/, body["error"])
  end

  # Verifica che lo stock NON venga decrementato se l'ordine fallisce (transazione atomica).
  test "create does not decrement stock when order fails" do
    @product1.update!(stock: 0)

    post "/api/orders",
         params: @valid_order_params,
         headers: auth_headers_for(@user)

    assert_response :unprocessable_entity
    assert_equal 0, @product1.reload.stock
    assert_equal 50, @product2.reload.stock  # non decrementato
  end

  # Verifica che item duplicati nello stesso ordine vengano sommati nelle quantità.
  test "create sums quantities when the same product appears multiple times in items" do
    params = @valid_order_params.deep_dup
    params[:order][:items] = [
      { id: "prod-1", quantity: 2 },
      { id: "prod-1", quantity: 3 }
    ]

    post "/api/orders",
         params: params,
         headers: auth_headers_for(@user)

    assert_response :created
    order = Order.last
    assert_equal 1, order.order_items.count
    assert_equal 5, order.order_items.first.quantity
    assert_equal 5, 10 - @product1.reload.stock
  end

  # Verifica che la quantity di default sia 1 se non specificata.
  test "create defaults quantity to 1 when not specified" do
    params = @valid_order_params.deep_dup
    params[:order][:items] = [ { id: "prod-1" } ]

    post "/api/orders",
         params: params,
         headers: auth_headers_for(@user)

    assert_response :created
    order = Order.last
    assert_equal 1, order.order_items.first.quantity
  end

  # Verifica che l'unit_price salvato nell'order_item sia il prezzo corrente del prodotto.
  test "create freezes unit_price to current product price" do
    post "/api/orders",
         params: @valid_order_params,
         headers: auth_headers_for(@user)

    order = Order.last
    item = order.order_items.find_by(product_id: "prod-1")
    assert_equal 1000.0, item.unit_price
  end

  # Verifica che la creazione fallisca con 422 se mancano campi obbligatori dell'ordine.
  test "create returns 422 when order total is missing" do
    params = @valid_order_params.deep_dup
    params[:order].delete(:total)

    post "/api/orders",
         params: params,
         headers: auth_headers_for(@user)

    assert_response :unprocessable_entity
    assert JSON.parse(response.body).key?("errors")
  end
end
