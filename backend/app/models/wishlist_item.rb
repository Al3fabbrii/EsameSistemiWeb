class WishlistItem < ApplicationRecord
  belongs_to :wishlist
  belongs_to :product, foreign_key: 'item_id', primary_key: 'id'

  validates :item_id, presence: true
  validates :item_id, uniqueness: { scope: :wishlist_id }

  def as_json(options = {})
    {
      id: id,
      wishlistId: wishlist_id,
      productId: item_id,
      product: product.as_json
    }
  end
end