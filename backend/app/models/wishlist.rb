class Wishlist < ApplicationRecord
  belongs_to :user
  has_many :wishlist_items, dependent: :destroy
  has_many :products, through: :wishlist_items

  def as_json(options = {})
    {
      id: id,
      userId: user_id,
      items: wishlist_items.map(&:as_json),
      createdAt: created_at.iso8601,
      updatedAt: updated_at.iso8601
    }
  end
end
