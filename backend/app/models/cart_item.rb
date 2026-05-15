class CartItem < ApplicationRecord
  belongs_to :cart
  belongs_to :product, foreign_key: 'item_id', primary_key: 'id'

  validates :quantity, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :unit_price, presence: true, numericality: { greater_than: 0 }
  validates :item_id, uniqueness: { scope: :cart_id }

  def subtotal
    quantity * unit_price
  end

  def as_json(options = {})
    {
      id: id,
      cartId: cart_id,
      productId: item_id,
      product: product.as_json,
      quantity: quantity,
      unitPrice: unit_price.to_f,
      subtotal: subtotal.to_f
    }
  end
end