ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end

# Helper per autenticazione JWT nei test dei controller protetti.
# Genera un token JWT valido per l'utente passato e restituisce gli header HTTP
# pronti per essere inclusi nelle richieste di test.
module AuthTestHelper
  # Genera un token JWT firmato come fa AuthController#generate_jwt_token.
  def jwt_token_for(user)
    payload = {
      user_id: user.id,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, Rails.application.secret_key_base, "HS256")
  end

  # Restituisce gli header Authorization da usare nelle richieste autenticate.
  def auth_headers_for(user)
    { "Authorization" => "Bearer #{jwt_token_for(user)}" }
  end
end

class ActionDispatch::IntegrationTest
  include AuthTestHelper
end
