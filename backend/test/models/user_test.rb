require "test_helper"

class UserTest < ActiveSupport::TestCase
  # ---------------------------------------------------------------------------
  # Validazioni base
  # ---------------------------------------------------------------------------

  # Verifica che un utente con email e password validi sia valido.
  test "valid with email_address and password" do
    user = User.new(
      email_address: "test@example.com",
      password: "password123"
    )
    assert user.valid?
  end

  # Verifica che senza email_address l'utente sia invalido e produca l'errore atteso.
  test "invalid without email_address" do
    user = User.new(password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email_address], "can't be blank"
  end

  # Verifica che il vincolo di unicità sull'email impedisca duplicati.
  test "invalid with duplicate email_address" do
    User.create!(email_address: "test@example.com", password: "password123")
    user = User.new(email_address: "test@example.com", password: "password123")
    assert_not user.valid?
    assert_includes user.errors[:email_address], "has already been taken"
  end

  # Verifica che un'email con formato non valido faccia fallire la validazione.
  test "invalid with malformed email_address" do
    user = User.new(email_address: "not-an-email", password: "password123")
    assert_not user.valid?
    assert_not_empty user.errors[:email_address]
  end

  # Verifica la normalizzazione dell'email: strip degli spazi e downcase.
  test "normalizes email_address by stripping and downcasing" do
    user = User.create!(email_address: "  TEST@Example.COM  ", password: "password123")
    assert_equal "test@example.com", user.email_address
  end

  # Verifica che senza password l'utente non si possa salvare (has_secure_password).
  test "invalid without password" do
    user = User.new(email_address: "test@example.com")
    assert_not user.valid?
  end

  # ---------------------------------------------------------------------------
  # Validazione del ruolo
  # ---------------------------------------------------------------------------

  # Verifica che il ruolo di default sia 'customer' (definito dallo schema DB).
  test "defaults role to customer" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    assert_equal "customer", user.role
  end

  # Verifica che il ruolo 'admin' sia accettato come valore valido.
  test "valid with admin role" do
    user = User.new(email_address: "admin@example.com", password: "password123", role: "admin")
    assert user.valid?
  end

  # Verifica che un ruolo non incluso nella lista bianca venga rifiutato.
  test "invalid with unknown role" do
    user = User.new(email_address: "test@example.com", password: "password123", role: "superuser")
    assert_not user.valid?
    assert_includes user.errors[:role], "is not included in the list"
  end

  # ---------------------------------------------------------------------------
  # Password e autenticazione
  # ---------------------------------------------------------------------------

  # Verifica che has_secure_password permetta l'autenticazione con password corretta
  # e la rifiuti con password sbagliata.
  test "has secure password" do
    user = User.create!(
      email_address: "test@example.com",
      password: "password123"
    )
    assert user.authenticate("password123")
    assert_not user.authenticate("wrongpassword")
  end

  # Verifica che la password non venga salvata in chiaro ma come digest.
  test "stores password as digest, not plaintext" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    assert_not_equal "password123", user.password_digest
    assert_not_nil user.password_digest
  end

  # ---------------------------------------------------------------------------
  # Metodo admin?
  # ---------------------------------------------------------------------------

  # Verifica che admin? restituisca true per utenti con ruolo admin.
  test "admin? returns true when role is admin" do
    user = User.create!(email_address: "admin@example.com", password: "password123", role: "admin")
    assert user.admin?
  end

  # Verifica che admin? restituisca false per utenti customer.
  test "admin? returns false when role is customer" do
    user = User.create!(email_address: "user@example.com", password: "password123")
    assert_not user.admin?
  end

  # ---------------------------------------------------------------------------
  # Metodo current_cart
  # ---------------------------------------------------------------------------

  # Verifica che current_cart crei un nuovo carrello se l'utente non ne ha.
  test "current_cart creates a new cart when user has none" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    assert_difference "Cart.count", 1 do
      cart = user.current_cart
      assert_equal user, cart.user
    end
  end

  # Verifica che current_cart restituisca l'ultimo carrello esistente senza crearne uno nuovo.
  test "current_cart returns existing cart without creating a new one" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    existing_cart = Cart.create!(user: user)

    assert_no_difference "Cart.count" do
      assert_equal existing_cart, user.current_cart
    end
  end

  # ---------------------------------------------------------------------------
  # Metodo current_wishlist
  # ---------------------------------------------------------------------------

  # Verifica che current_wishlist crei una nuova wishlist se l'utente non ne ha.
  test "current_wishlist creates a new wishlist when user has none" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    assert_difference "Wishlist.count", 1 do
      wishlist = user.current_wishlist
      assert_equal user, wishlist.user
    end
  end

  # Verifica che current_wishlist restituisca quella esistente senza crearne una nuova.
  test "current_wishlist returns existing wishlist without creating a new one" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    existing = Wishlist.create!(user: user)

    assert_no_difference "Wishlist.count" do
      assert_equal existing, user.current_wishlist
    end
  end

  # ---------------------------------------------------------------------------
  # Relazioni
  # ---------------------------------------------------------------------------

  # Verifica che un utente possa avere più ordini associati.
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

  # Verifica che la cancellazione dell'utente elimini a cascata gli ordini.
  test "destroys associated orders when user is destroyed" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    Order.create!(
      user: user, total: 10.0,
      customer: { name: "Test" }, address: { street: "123 St" }
    )

    assert_difference "Order.count", -1 do
      user.destroy
    end
  end

  # Verifica che la cancellazione dell'utente elimini a cascata i carrelli.
  test "destroys associated carts when user is destroyed" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    Cart.create!(user: user)

    assert_difference "Cart.count", -1 do
      user.destroy
    end
  end

  # Verifica che la cancellazione dell'utente elimini a cascata le wishlist.
  test "destroys associated wishlists when user is destroyed" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    Wishlist.create!(user: user)

    assert_difference "Wishlist.count", -1 do
      user.destroy
    end
  end

  # ---------------------------------------------------------------------------
  # Serializzazione JSON
  # ---------------------------------------------------------------------------

  # Verifica che as_json includa le chiavi attese in camelCase e ometta dati sensibili.
  test "as_json returns expected keys and omits password_digest" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    json = user.as_json

    assert_equal user.id, json[:id]
    assert_equal "test@example.com", json[:email]
    assert_equal "customer", json[:role]
    assert json.key?(:createdAt)
    assert_not json.key?(:password_digest)
    assert_not json.key?(:email_address)
  end

  # Verifica che createdAt sia formattato come stringa ISO8601.
  test "as_json formats createdAt as ISO8601" do
    user = User.create!(email_address: "test@example.com", password: "password123")
    assert_match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, user.as_json[:createdAt])
  end
end
