class CreateCartItems < ActiveRecord::Migration[8.1]
  def change
    create_table :cart_items do |t|
      t.references :cart, null: false, foreign_key: true
      t.string :item_id
      t.integer :quantity
      t.decimal :unit_price

      t.timestamps
    end
  end
end
