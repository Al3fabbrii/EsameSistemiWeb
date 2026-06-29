require "test_helper"

class WishlistItemTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email_address: "test@example.com", password: "password123")
    @wishlist = Wishlist.create!(user: @user)
    @product = Product.create!(
      id: "wish-prod",
      title: "Wish Product",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )
  end

  # ---------------------------------------------------------------------------
  # Validazioni
  # ---------------------------------------------------------------------------

  # Verifica che un wishlist_item con wishlist e product validi sia valido.
  test "valid with wishlist and product" do
    item = WishlistItem.new(wishlist: @wishlist, product: @product)
    assert item.valid?
  end

  # Verifica che senza item_id (product) non sia valido.
  test "invalid without item_id" do
    item = WishlistItem.new(wishlist: @wishlist)
    assert_not item.valid?
    assert_includes item.errors[:item_id], "can't be blank"
  end

  # Verifica che lo stesso prodotto non possa essere aggiunto due volte alla stessa wishlist.
  test "invalid with duplicate product in same wishlist" do
    WishlistItem.create!(wishlist: @wishlist, product: @product)
    duplicate = WishlistItem.new(wishlist: @wishlist, product: @product)

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:item_id], "has already been taken"
  end

  # Verifica che lo stesso prodotto possa stare in wishlist diverse.
  test "valid with same product in different wishlists" do
    other_user = User.create!(email_address: "other@example.com", password: "password123")
    other_wishlist = Wishlist.create!(user: other_user)

    WishlistItem.create!(wishlist: @wishlist, product: @product)
    item = WishlistItem.new(wishlist: other_wishlist, product: @product)

    assert item.valid?
  end

  # ---------------------------------------------------------------------------
  # Relazioni
  # ---------------------------------------------------------------------------

  # Verifica la relazione belongs_to con Wishlist.
  test "belongs to wishlist" do
    item = WishlistItem.create!(wishlist: @wishlist, product: @product)
    assert_equal @wishlist, item.wishlist
  end

  # Verifica la relazione belongs_to con Product tramite foreign_key item_id.
  test "belongs to product via item_id" do
    item = WishlistItem.create!(wishlist: @wishlist, product: @product)
    assert_equal @product, item.product
    assert_equal @product.id, item.item_id
  end

  # ---------------------------------------------------------------------------
  # Serializzazione JSON
  # ---------------------------------------------------------------------------

  # Verifica che as_json contenga le chiavi camelCase attese.
  test "as_json returns expected camelCase keys" do
    item = WishlistItem.create!(wishlist: @wishlist, product: @product)
    json = item.as_json

    assert_equal item.id, json[:id]
    assert_equal @wishlist.id, json[:wishlistId]
    assert_equal @product.id, json[:productId]
    assert json.key?(:product)
  end

  # Verifica che il prodotto nidificato sia nel formato Product#as_json.
  test "as_json embeds nested product representation" do
    item = WishlistItem.create!(wishlist: @wishlist, product: @product)
    product_json = item.as_json[:product]

    assert_equal @product.id, product_json[:id]
    assert_equal "Wish Product", product_json[:title]
  end

  # ---------------------------------------------------------------------------
  # Property-based testing
  # ---------------------------------------------------------------------------

  # Invariante di unicità: a prescindere da quante volte si tenti di aggiungere
  # lo stesso prodotto alla stessa wishlist, ne resta salvato esattamente uno
  # e tutti i tentativi successivi sono invalid?.
  test "aggiungere N volte lo stesso prodotto alla stessa wishlist lascia 1 item (PBT)" do
    property_of {
      range(2, 10)
    }.check(20) do |n|
      fresh_user = User.create!(
        email_address: "pbt-wish-#{SecureRandom.hex(8)}@example.com",
        password: "password123"
      )
      fresh_wishlist = Wishlist.create!(user: fresh_user)

      WishlistItem.create!(wishlist: fresh_wishlist, product: @product)

      (n - 1).times do |i|
        duplicate = WishlistItem.new(wishlist: fresh_wishlist, product: @product)
        assert_not duplicate.valid?,
          "il tentativo n. #{i + 2} di aggiungere lo stesso prodotto dovrebbe essere invalido"
      end

      assert_equal 1, fresh_wishlist.wishlist_items.count,
        "dopo #{n} tentativi dovrebbe esserci esattamente 1 item nella wishlist"
    end
  end
end
