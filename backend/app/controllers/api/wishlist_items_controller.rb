module Api
  class WishlistItemsController < ApplicationController
    before_action :set_wishlist
    before_action :set_wishlist_item, only: [:destroy]

    # POST /api/wishlist/items
    def create
      product = Product.find(params[:product_id])

      # Verifica se il prodotto è già nella wishlist
      wishlist_item = @wishlist.wishlist_items.find_by(item_id: product.id)

      if wishlist_item
        # Prodotto già presente, non fare nulla (o restituisci messaggio)
        render json: @wishlist.as_json, status: :ok
      else
        # Crea nuovo item
        wishlist_item = @wishlist.wishlist_items.create!(
          item_id: product.id
        )
        render json: @wishlist.as_json, status: :created
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Product not found' }, status: :not_found
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    end

    # DELETE /api/wishlist/items/:id
    def destroy
      @wishlist_item.destroy!
      render json: @wishlist.as_json
    end

    private

    def set_wishlist
      @wishlist = current_user.current_wishlist
    end

    def set_wishlist_item
      @wishlist_item = @wishlist.wishlist_items.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Wishlist item not found' }, status: :not_found
    end
  end
end
