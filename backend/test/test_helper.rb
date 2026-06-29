# SimpleCov deve essere richiesto e avviato prima del codice applicativo,
# altrimenti i file già caricati non verrebbero tracciati.
require "simplecov"
SimpleCov.start "rails" do
  add_filter "/test/"
  add_filter "/config/"
  add_filter "/db/"
  enable_coverage :branch
end

ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

# Property-based testing via Rantly. Evitiamo "rantly/minitest_extensions"
# perché in rantly 3.0.0 carica "minitest/unit", rimosso in Minitest 6+.
# L'extension definisce solo property_of come scorciatoia: lo definiamo qui.
require "rantly"
require "rantly/property"
module PropertyTestHelper
  def property_of(&block)
    Rantly::Property.new(block)
  end
end

module ActiveSupport
  class TestCase
    include PropertyTestHelper

    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Ogni worker parallelo è un processo separato e sovrascriverebbe lo stesso
    # file di coverage. Diamo a ognuno un command_name univoco così SimpleCov
    # unisce i risultati parziali al termine della suite.
    parallelize_setup do |worker|
      SimpleCov.command_name "#{SimpleCov.command_name}-#{worker}"
    end

    parallelize_teardown do |_worker|
      SimpleCov.result
    end

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
