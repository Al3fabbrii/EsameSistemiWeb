require "test_helper"

class Api::AuthControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(
      email_address: "user@example.com",
      password: "password123"
    )
  end

  # ---------------------------------------------------------------------------
  # POST /api/auth/login
  # ---------------------------------------------------------------------------

  # Verifica login riuscito: status 200, token JWT presente, user serializzato.
  test "login succeeds with valid credentials" do
    post "/api/auth/login", params: { email: "user@example.com", password: "password123" }

    assert_response :success
    body = JSON.parse(response.body)
    assert body.key?("token")
    assert_not_empty body["token"]
    assert_equal "user@example.com", body["user"]["email"]
  end

  # Verifica che il login normalizzi l'email (case-insensitive, trim).
  test "login normalizes email (case-insensitive)" do
    post "/api/auth/login", params: { email: "USER@Example.COM", password: "password123" }
    assert_response :success
  end

  # Verifica che con password errata il login fallisca con 401.
  test "login fails with wrong password" do
    post "/api/auth/login", params: { email: "user@example.com", password: "wrong" }

    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "Invalid email or password", body["error"]
  end

  # Verifica che con email inesistente il login fallisca con 401.
  test "login fails with unknown email" do
    post "/api/auth/login", params: { email: "nobody@example.com", password: "password123" }

    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "Invalid email or password", body["error"]
  end

  # Verifica che il token JWT generato sia decodificabile e contenga user_id corretto.
  test "login returns a JWT decodable to the user_id" do
    post "/api/auth/login", params: { email: "user@example.com", password: "password123" }
    token = JSON.parse(response.body)["token"]

    decoded = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: "HS256")
    assert_equal @user.id, decoded[0]["user_id"]
    assert decoded[0]["exp"].present?
  end

  # ---------------------------------------------------------------------------
  # POST /api/auth/register
  # ---------------------------------------------------------------------------

  # Verifica registrazione riuscita: 201 Created, token e user nel body.
  test "register succeeds with valid email and password" do
    assert_difference "User.count", 1 do
      post "/api/auth/register", params: { email: "new@example.com", password: "password123" }
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert body.key?("token")
    assert_equal "new@example.com", body["user"]["email"]
  end

  # Verifica che la registrazione con email duplicata fallisca con 422.
  test "register fails with duplicate email" do
    assert_no_difference "User.count" do
      post "/api/auth/register", params: { email: "user@example.com", password: "password123" }
    end

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert body["errors"].any? { |e| e.include?("Email address") }
  end

  # Verifica che la registrazione con email malformata fallisca con 422.
  test "register fails with invalid email format" do
    post "/api/auth/register", params: { email: "not-an-email", password: "password123" }

    assert_response :unprocessable_entity
    assert JSON.parse(response.body).key?("errors")
  end

  # Verifica che il nuovo utente venga creato con ruolo 'customer' di default.
  test "register creates user with default customer role" do
    post "/api/auth/register", params: { email: "new@example.com", password: "password123" }

    user = User.find_by(email_address: "new@example.com")
    assert_equal "customer", user.role
  end

  # ---------------------------------------------------------------------------
  # POST /api/auth/logout
  # ---------------------------------------------------------------------------

  # Verifica che il logout restituisca 204 No Content (gestione lato client del JWT).
  test "logout returns 204 no content" do
    post "/api/auth/logout"
    assert_response :no_content
  end

  # ---------------------------------------------------------------------------
  # GET /api/auth/me
  # ---------------------------------------------------------------------------

  # Verifica che /me restituisca l'utente corrente quando autenticato.
  test "me returns current user when authenticated" do
    get "/api/auth/me", headers: auth_headers_for(@user)

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal @user.id, body["id"]
    assert_equal "user@example.com", body["email"]
  end

  # Verifica che /me fallisca con 401 se manca il token.
  test "me fails with 401 when token is missing" do
    get "/api/auth/me"

    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "Missing authentication token", body["error"]
  end

  # Verifica che /me fallisca con 401 se il token è invalido.
  test "me fails with 401 when token is invalid" do
    get "/api/auth/me", headers: { "Authorization" => "Bearer invalid-token" }

    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "Invalid or expired token", body["error"]
  end

  # Verifica che /me fallisca con 401 se il token è scaduto.
  test "me fails with 401 when token is expired" do
    expired_payload = { user_id: @user.id, exp: 1.hour.ago.to_i }
    expired_token = JWT.encode(expired_payload, Rails.application.secret_key_base, "HS256")

    get "/api/auth/me", headers: { "Authorization" => "Bearer #{expired_token}" }

    assert_response :unauthorized
  end

  # Verifica che /me fallisca con 401 se il token punta a un utente cancellato.
  test "me fails with 401 when user no longer exists" do
    token = jwt_token_for(@user)
    @user.destroy

    get "/api/auth/me", headers: { "Authorization" => "Bearer #{token}" }

    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "User not found", body["error"]
  end

  # Verifica che il formato "Bearer <token>" sia rispettato (header senza prefisso Bearer).
  test "me fails when Authorization header is missing Bearer prefix" do
    get "/api/auth/me", headers: { "Authorization" => jwt_token_for(@user) }

    assert_response :unauthorized
  end
end
