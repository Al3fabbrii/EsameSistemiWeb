class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_many :carts, dependent: :destroy
  has_many :wishlists, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  validates :email_address, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  def as_json(options = {})
    {
      id: id,
      email: email_address,
      createdAt: created_at.iso8601
    }
  end

  def current_cart
    carts.last || carts.create!
  end

  def current_wishlist
    wishlists.last || wishlists.create!
  end
end
