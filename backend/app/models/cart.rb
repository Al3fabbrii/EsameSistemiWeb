class Cart < ApplicationRecord
  belongs_to :user
  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items

  def total
    cart_items.sum { |item| item.quantity * item.unit_price }
  end

  def as_json(options = {})
    {
      id: id,
      userId: user_id,
      items: cart_items.map(&:as_json),
      total: total.to_f,
      createdAt: created_at.iso8601,
      updatedAt: updated_at.iso8601
    }
  end
end
