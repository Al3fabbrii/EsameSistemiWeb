require "test_helper"

class Api::ProductsControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Creiamo alcuni prodotti di test
    @product1 = Product.create!(
      id: "laptop-1",
      title: "Laptop",
      description: "High-performance laptop",
      price: 999.99,
      original_price: 1299.99,
      sale: true,
      stock: 10,
      tags: ["electronics", "computers"]
    )

    @product2 = Product.create!(
      id: "mouse-1",
      title: "Mouse",
      description: "Wireless mouse",
      price: 29.99,
      original_price: 39.99,
      sale: false,
      stock: 50,
      tags: ["electronics", "accessories"]
    )

    @product3 = Product.create!(
      id: "keyboard-1",
      title: "Keyboard",
      description: "Mechanical keyboard",
      price: 149.99,
      original_price: 179.99,
      sale: true,
      stock: 0,
      tags: ["electronics", "accessories"]
    )
  end

  # Test GET /api/products without filters
  test "returns all products" do
    get "/api/products"

    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal 3, json_response.length
  end

  test "returns products in descending order by creation date default" do
    get "/api/products"

    json_response = JSON.parse(response.body)
    # L'ultimo creato dovrebbe essere primo
    assert_equal "Keyboard", json_response.first["title"]
    assert_equal "Laptop", json_response.last["title"]
  end

  # Test GET /api/products with search filter
  test "filters products by title case-insensitive" do
    get "/api/products", params: { search: "laptop" }

    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal 1, json_response.length
    assert_equal "Laptop", json_response.first["title"]
  end

  test "returns multiple matches for search" do
    get "/api/products", params: { search: "o" }

    json_response = JSON.parse(response.body)
    assert_operator json_response.length, :>=, 2
    titles = json_response.map { |p| p["title"] }
    assert_includes titles, "Mouse"
    assert_includes titles, "Keyboard"
  end

  test "returns empty array when no search matches" do
    get "/api/products", params: { search: "NonexistentProduct" }

    json_response = JSON.parse(response.body)
    assert_empty json_response
  end

  # Test GET /api/products with price filters
  test "filters by minimum price" do
    get "/api/products", params: { price_min: 100 }

    json_response = JSON.parse(response.body)
    assert_equal 2, json_response.length
    json_response.each do |product|
      assert_operator product["price"], :>=, 100
    end
  end

  test "filters by maximum price" do
    get "/api/products", params: { price_max: 100 }

    json_response = JSON.parse(response.body)
    assert_equal 1, json_response.length
    assert_equal "Mouse", json_response.first["title"]
  end

  test "filters by price range" do
    get "/api/products", params: { price_min: 50, price_max: 500 }

    json_response = JSON.parse(response.body)
    assert_equal 1, json_response.length
    assert_equal "Keyboard", json_response.first["title"]
    assert_operator json_response.first["price"], :>=, 50
    assert_operator json_response.first["price"], :<=, 500
  end

  # Test GET /api/products with sorting
  test "sorts by price ascending" do
    get "/api/products", params: { sort: "price_asc" }

    json_response = JSON.parse(response.body)
    assert_equal "Mouse", json_response.first["title"]
    assert_equal "Laptop", json_response.last["title"]

    # Verifica che i prezzi siano in ordine crescente
    prices = json_response.map { |p| p["price"] }
    assert_equal prices.sort, prices
  end

  test "sorts by price descending" do
    get "/api/products", params: { sort: "price_desc" }

    json_response = JSON.parse(response.body)
    assert_equal "Laptop", json_response.first["title"]
    assert_equal "Mouse", json_response.last["title"]

    # Verifica che i prezzi siano in ordine decrescente
    prices = json_response.map { |p| p["price"] }
    assert_equal prices.sort.reverse, prices
  end

  test "sorts by date ascending" do
    get "/api/products", params: { sort: "date_asc" }

    json_response = JSON.parse(response.body)
    assert_equal "Laptop", json_response.first["title"]
    assert_equal "Keyboard", json_response.last["title"]
  end

  test "sorts by date descending explicit" do
    get "/api/products", params: { sort: "date_desc" }

    json_response = JSON.parse(response.body)
    assert_equal "Keyboard", json_response.first["title"]
    assert_equal "Laptop", json_response.last["title"]
  end

  # Test GET /api/products with combined filters
  test "combines search and price filters" do
    get "/api/products", params: { search: "e", price_min: 100 }

    json_response = JSON.parse(response.body)
    json_response.each do |product|
      assert_includes product["title"].downcase, "e"
      assert_operator product["price"], :>=, 100
    end
  end

  test "combines all filters and sorting" do
    get "/api/products", params: {
      search: "o",
      price_max: 200,
      sort: "price_asc"
    }

    json_response = JSON.parse(response.body)
    assert_not_empty json_response

    # Verifica che tutti i prodotti soddisfino i criteri
    json_response.each do |product|
      assert_includes product["title"].downcase, "o"
      assert_operator product["price"], :<=, 200
    end

    # Verifica l'ordinamento
    prices = json_response.map { |p| p["price"] }
    assert_equal prices.sort, prices
  end

  # Test GET /api/products/:id
  test "returns the product when it exists" do
    get "/api/products/#{@product1.id}"

    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal @product1.id, json_response["id"]
    assert_equal "Laptop", json_response["title"]
  end

  test "returns product with camelCase attributes" do
    get "/api/products/#{@product1.id}"

    json_response = JSON.parse(response.body)
    assert json_response.key?("originalPrice")
    assert json_response.key?("createdAt")
    assert_equal 1299.99, json_response["originalPrice"]
  end

  test "returns not found error when product does not exist" do
    get "/api/products/99999"

    assert_response :not_found
    json_response = JSON.parse(response.body)
    assert_equal "Product not found", json_response["error"]
  end

  # Test JSON response format
  test "returns products with correct camelCase format" do
    get "/api/products"

    json_response = JSON.parse(response.body)
    product = json_response.first

    assert product.key?("id")
    assert product.key?("title")
    assert product.key?("description")
    assert product.key?("price")
    assert product.key?("originalPrice")
    assert product.key?("sale")
    assert product.key?("thumbnail")
    assert product.key?("tags")
    assert product.key?("stock")
    assert product.key?("createdAt")
  end

  test "does not require authentication" do
    # Questo test verifica che il controller salta l'autenticazione
    get "/api/products"

    assert_response :success
    # Non dovrebbe richiedere autenticazione
  end
end
