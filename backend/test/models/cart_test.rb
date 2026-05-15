require "test_helper"

class CartTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(email_address: "test@example.com", password: "password123")
  end

  test "valid with user" do
    cart = Cart.new(user: @user)
    assert cart.valid?
  end

  test "belongs to user" do
    cart = Cart.create!(user: @user)
    assert_equal @user, cart.user
  end

  test "has many cart_items" do
    cart = Cart.create!(user: @user)
    product1 = Product.create!(
      id: "test-product-1",
      title: "Product 1",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )
    product2 = Product.create!(
      id: "test-product-2",
      title: "Product 2",
      price: 20.0,
      original_price: 25.0,
      stock: 3
    )

    item1 = CartItem.create!(cart: cart, product: product1, quantity: 2, unit_price: 10.0)
    item2 = CartItem.create!(cart: cart, product: product2, quantity: 1, unit_price: 20.0)

    assert_includes cart.cart_items, item1
    assert_includes cart.cart_items, item2
    assert_equal 2, cart.cart_items.count
  end

  test "destroys associated cart_items when cart is destroyed" do
    cart = Cart.create!(user: @user)
    product = Product.create!(
      id: "test-product-3",
      title: "Product",
      price: 10.0,
      original_price: 15.0,
      stock: 5
    )
    CartItem.create!(cart: cart, product: product, quantity: 1, unit_price: 10.0)

    assert_difference "CartItem.count", -1 do
      cart.destroy
    end
  end
end
