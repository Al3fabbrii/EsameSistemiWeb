module Api
  class WishlistsController < ApplicationController
    # GET /api/wishlist
    def show
      wishlist = current_user.current_wishlist
      render json: wishlist.as_json
    end
  end
end
