require "test_helper"

class Api::WishlistsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(email_address: "user@example.com", password: "password123")
    @product = Product.create!(
      id: "test-product",
      title: "Test Product",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )
  end

  # ---------------------------------------------------------------------------
  # GET /api/wishlist
  # ---------------------------------------------------------------------------

  # Verifica che senza autenticazione la richiesta venga rifiutata con 401.
  test "show requires authentication" do
    get "/api/wishlist"
    assert_response :unauthorized
  end

  # Verifica che un utente autenticato ottenga la propria wishlist.
  test "show returns the current user wishlist" do
    get "/api/wishlist", headers: auth_headers_for(@user)

    assert_response :success
    body = JSON.parse(response.body)
    assert body.key?("id")
    assert_equal @user.id, body["userId"]
    assert_equal [], body["items"]
  end

  # Verifica la lazy creation: se l'utente non ha wishlist viene creata al volo.
  test "show lazily creates a wishlist for users who do not have one" do
    assert_equal 0, @user.wishlists.count

    assert_difference "Wishlist.count", 1 do
      get "/api/wishlist", headers: auth_headers_for(@user)
    end

    assert_response :success
  end

  # Verifica che venga restituita la wishlist esistente senza crearne un'altra.
  test "show returns existing wishlist without creating a new one" do
    wishlist = Wishlist.create!(user: @user)

    assert_no_difference "Wishlist.count" do
      get "/api/wishlist", headers: auth_headers_for(@user)
    end

    body = JSON.parse(response.body)
    assert_equal wishlist.id, body["id"]
  end

  # Verifica che la wishlist restituita contenga gli items con i prodotti annidati.
  test "show includes wishlist items with product details" do
    wishlist = @user.current_wishlist
    WishlistItem.create!(wishlist: wishlist, product: @product)

    get "/api/wishlist", headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_equal 1, body["items"].size
    item = body["items"].first
    assert_equal @product.id, item["productId"]
    assert_equal "Test Product", item["product"]["title"]
  end

  # Verifica che ogni utente veda solo la propria wishlist (isolamento).
  test "show is scoped to the authenticated user only" do
    other_user = User.create!(email_address: "other@example.com", password: "password123")
    other_wishlist = Wishlist.create!(user: other_user)
    WishlistItem.create!(wishlist: other_wishlist, product: @product)

    get "/api/wishlist", headers: auth_headers_for(@user)

    body = JSON.parse(response.body)
    assert_not_equal other_wishlist.id, body["id"]
    assert_empty body["items"]
  end
end
