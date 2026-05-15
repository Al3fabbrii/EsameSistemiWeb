require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "valid with email_address and password" do
    user = User.new(
      email_address: "test@example.com",
      password: "password123"
    )
    assert user.valid?
  end

  test "invalid without email_address" do
    user = User.new(password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email_address], "can't be blank"
  end

  test "invalid with duplicate email_address" do
    User.create!(email_address: "test@example.com", password: "password123")
    user = User.new(email_address: "test@example.com", password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email_address], "has already been taken"
  end

  test "has secure password" do
    user = User.create!(
      email_address: "test@example.com",
      password: "password123"
    )
    assert user.authenticate("password123")
    assert_not user.authenticate("wrongpassword")
  end

  test "can have a cart" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    cart = Cart.create!(user: user)
    assert_equal user, cart.user
  end

  test "has many orders" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    order1 = Order.create!(
      user: user,
      total: 10.0,
      customer: { name: "Test" },
      address: { street: "123 St" }
    )
    order2 = Order.create!(
      user: user,
      total: 20.0,
      customer: { name: "Test" },
      address: { street: "123 St" }
    )
    assert_includes user.orders, order1
    assert_includes user.orders, order2
    assert_equal 2, user.orders.count
  end
end
