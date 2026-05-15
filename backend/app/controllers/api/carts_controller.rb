module Api
  class CartsController < ApplicationController
    # GET /api/cart
    def show
      cart = current_user.current_cart
      render json: cart.as_json
    end
  end
end
