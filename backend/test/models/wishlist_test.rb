require "test_helper"

class WishlistTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email_address: "test@example.com", password: "password123")
    @product1 = Product.create!(
      id: "wish-prod-1",
      title: "Wish 1",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )
    @product2 = Product.create!(
      id: "wish-prod-2",
      title: "Wish 2",
      price: 20.0,
      original_price: 25.0,
      stock: 3
    )
  end

  # ---------------------------------------------------------------------------
  # Validazioni e relazioni base
  # ---------------------------------------------------------------------------

  # Verifica che una wishlist associata a un utente sia valida.
  test "valid with user" do
    wishlist = Wishlist.new(user: @user)
    assert wishlist.valid?
  end

  # Verifica che senza utente la wishlist non sia valida.
  test "invalid without user" do
    wishlist = Wishlist.new
    assert_not wishlist.valid?
  end

  # Verifica la relazione belongs_to con User.
  test "belongs to user" do
    wishlist = Wishlist.create!(user: @user)
    assert_equal @user, wishlist.user
  end

  # Verifica che una wishlist possa contenere più wishlist_items.
  test "has many wishlist_items" do
    wishlist = Wishlist.create!(user: @user)
    item1 = WishlistItem.create!(wishlist: wishlist, product: @product1)
    item2 = WishlistItem.create!(wishlist: wishlist, product: @product2)

    assert_includes wishlist.wishlist_items, item1
    assert_includes wishlist.wishlist_items, item2
    assert_equal 2, wishlist.wishlist_items.count
  end

  # Verifica la relazione has_many through :products.
  test "has many products through wishlist_items" do
    wishlist = Wishlist.create!(user: @user)
    WishlistItem.create!(wishlist: wishlist, product: @product1)

    assert_includes wishlist.products, @product1
  end

  # Verifica che la cancellazione della wishlist elimini a cascata i wishlist_items.
  test "destroys associated wishlist_items when wishlist is destroyed" do
    wishlist = Wishlist.create!(user: @user)
    WishlistItem.create!(wishlist: wishlist, product: @product1)

    assert_difference "WishlistItem.count", -1 do
      wishlist.destroy
    end
  end

  # ---------------------------------------------------------------------------
  # Serializzazione JSON
  # ---------------------------------------------------------------------------

  # Verifica che as_json restituisca le chiavi camelCase attese.
  test "as_json returns expected camelCase keys" do
    wishlist = Wishlist.create!(user: @user)
    json = wishlist.as_json

    assert_equal wishlist.id, json[:id]
    assert_equal @user.id, json[:userId]
    assert json.key?(:items)
    assert json.key?(:createdAt)
    assert json.key?(:updatedAt)
  end

  # Verifica che as_json includa la serializzazione di tutti gli items.
  test "as_json includes all wishlist_items serialized" do
    wishlist = Wishlist.create!(user: @user)
    WishlistItem.create!(wishlist: wishlist, product: @product1)
    WishlistItem.create!(wishlist: wishlist, product: @product2)

    assert_equal 2, wishlist.as_json[:items].size
  end

  # Verifica che createdAt e updatedAt siano formattati come ISO8601.
  test "as_json formats timestamps as ISO8601" do
    wishlist = Wishlist.create!(user: @user)
    json = wishlist.as_json

    assert_match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, json[:createdAt])
    assert_match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, json[:updatedAt])
  end

  # Verifica che una wishlist appena creata abbia items vuoto.
  test "as_json returns empty items for empty wishlist" do
    wishlist = Wishlist.create!(user: @user)
    assert_empty wishlist.as_json[:items]
  end
end
